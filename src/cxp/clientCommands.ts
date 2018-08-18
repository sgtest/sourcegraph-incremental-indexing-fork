import { Controller } from 'cxp/module/environment/controller'
import { ActionContributionClientCommandUpdateConfiguration, ConfigurationUpdateParams } from 'cxp/module/protocol'
import { isArray } from 'lodash-es'
import { Subscription, throwError, Unsubscribable } from 'rxjs'
import { switchMap, take } from 'rxjs/operators'
import { Context } from '../context'
import { isErrorLike } from '../errors'
import { ConfiguredExtension } from '../extensions/extension'
import { ConfigurationCascade, ConfigurationSubject, Settings } from '../settings'

/**
 * Registers the builtin client commands that are required by CXP. See
 * {@link module:cxp/module/protocol/contribution.ActionContribution#command} for documentation.
 */
export function registerBuiltinClientCommands<S extends ConfigurationSubject, C extends Settings>(
    context: Pick<Context<S, C>, 'configurationCascade' | 'updateExtensionSettings'>,
    controller: Controller<ConfiguredExtension, ConfigurationCascade<S, C>>
): Unsubscribable {
    const subscription = new Subscription()

    subscription.add(
        controller.registries.commands.registerCommand({
            command: 'open',
            run: (url: string) => {
                // The `open` client command is usually implemented by ActionItem rendering the action with the
                // HTML <a> element, not by handling it here. Using an HTML <a> element means it is a standard
                // link, and native system behaviors such as open-in-new-tab work.
                //
                // If a client is not running in a web browser, this handler should be updated to call the system's
                // default URL handler using the system (e.g., Electron) API.
                window.open(url, '_blank')
                return Promise.resolve()
            },
        })
    )

    subscription.add(
        controller.registries.commands.registerCommand({
            command: 'updateConfiguration',
            run: (...anyArgs: any[]): Promise<void> => {
                const args = anyArgs as ActionContributionClientCommandUpdateConfiguration['commandArguments']
                // Return with .toPromise() so that it gets executed (otherwise, the observable will never be
                // subscribed to and will never execute the update operation).
                return updateConfiguration(context, convertUpdateConfigurationCommandArgs(args))
            },
        })
    )

    return subscription
}

/**
 * Applies an edit to the configuration settings of the highest-precedence subject.
 */
export function updateConfiguration<S extends ConfigurationSubject, C extends Settings>(
    context: Pick<Context<S, C>, 'configurationCascade' | 'updateExtensionSettings'>,
    params: ConfigurationUpdateParams
): Promise<void> {
    // TODO(sqs): Allow extensions to specify which subject's configuration to update
    // (instead of always updating the highest-precedence subject's configuration).
    return context.configurationCascade
        .pipe(
            take(1),
            switchMap(x => {
                if (!x.subjects) {
                    return throwError(new Error('unable to update configuration: no configuration subjects available'))
                }
                if (isErrorLike(x.subjects)) {
                    return throwError(
                        new Error(
                            `unable to update configuration: error retrieving configuration subjects: ${
                                x.subjects.message
                            }`
                        )
                    )
                }
                const subject = x.subjects[x.subjects.length - 1].subject
                return context.updateExtensionSettings(subject.id, { edit: params })
            })
        )
        .toPromise()
}

/**
 * Converts the arguments for the `updateConfiguration` client command (as documented in
 * {@link ActionContributionClientCommandUpdateConfiguration#commandArguments})
 * to {@link ConfigurationUpdateParams}.
 */
export function convertUpdateConfigurationCommandArgs(
    args: ActionContributionClientCommandUpdateConfiguration['commandArguments']
): ConfigurationUpdateParams {
    if (
        !isArray(args) ||
        !(args.length >= 2 && args.length <= 4) ||
        !isArray(args[0]) ||
        !(args[2] === undefined || args[2] === null)
    ) {
        throw new Error(`invalid updateConfiguration arguments: ${JSON.stringify(args)}`)
    }
    const valueIsJSONEncoded = args.length === 4 && args[3] === 'json'
    return { path: args[0], value: valueIsJSONEncoded ? JSON.parse(args[1]) : args[1] }
}
