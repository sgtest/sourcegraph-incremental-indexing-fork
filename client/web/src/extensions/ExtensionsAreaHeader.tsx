import * as React from 'react'

import { mdiPuzzleOutline } from '@mdi/js'
import { RouteComponentProps } from 'react-router-dom'

import { PageHeader, Button, Link, Icon, Tooltip } from '@sourcegraph/wildcard'

import { ActionButtonDescriptor } from '../util/contributions'

import { ExtensionsAreaRouteContext } from './ExtensionsArea'

export interface ExtensionsAreaHeaderProps extends ExtensionsAreaRouteContext, RouteComponentProps<{}> {
    isPrimaryHeader: boolean
    actionButtons: readonly ExtensionsAreaHeaderActionButton[]
}

export interface ExtensionAreaHeaderContext {
    isPrimaryHeader: boolean
}

export interface ExtensionsAreaHeaderActionButton extends ActionButtonDescriptor<ExtensionAreaHeaderContext> {}

/**
 * Header for the extensions area.
 */
export const ExtensionsAreaHeader: React.FunctionComponent<
    React.PropsWithChildren<ExtensionsAreaHeaderProps>
> = props => (
    <div className="container">
        {props.isPrimaryHeader && (
            <PageHeader
                actions={props.actionButtons.map(
                    ({ condition = () => true, to, icon: ButtonIcon, label, tooltip }) =>
                        condition(props) && (
                            <Tooltip content={tooltip}>
                                <Button className="ml-2" to={to(props)} key={label} variant="secondary" as={Link}>
                                    {ButtonIcon && <Icon as={ButtonIcon} aria-hidden={true} />} {label}
                                </Button>
                            </Tooltip>
                        )
                )}
            >
                <PageHeader.Heading as="h2" styleAs="h1">
                    <PageHeader.Breadcrumb icon={mdiPuzzleOutline}>Extensions</PageHeader.Breadcrumb>
                </PageHeader.Heading>
            </PageHeader>
        )}
    </div>
)
