import { UserEvent } from '@sourcegraph/shared/src/graphql-operations'

import { authenticatedUser } from '../../auth'
import { logUserEvent, logEvent } from '../../user/settings/backend'

class ServerAdminWrapper {
    /**
     * isAuthenicated is a flag that indicates if a user is signed in.
     */
    private isAuthenicated = false

    constructor() {
        // ServerAdminWrapper is never teared down
        // eslint-disable-next-line rxjs/no-ignored-subscription
        authenticatedUser.subscribe(user => {
            if (user) {
                this.isAuthenicated = true
            }
        })
    }

    public trackPageView(
        eventAction: string,
        logAsActiveUser: boolean = true,
        eventProperties?: any,
        publicArgument?: any
    ): void {
        if (logAsActiveUser) {
            logUserEvent(UserEvent.PAGEVIEW)
        }
        if (this.isAuthenicated) {
            if (eventAction === 'ViewRepository' || eventAction === 'ViewBlob' || eventAction === 'ViewTree') {
                logUserEvent(UserEvent.STAGECODE)
            }
        }
        logEvent(eventAction, eventProperties, publicArgument)
    }

    public trackAction(eventAction: string, eventProperties?: any, publicArgument?: any): void {
        if (this.isAuthenicated) {
            if (eventAction === 'SearchResultsQueried') {
                logUserEvent(UserEvent.SEARCHQUERY)
                logUserEvent(UserEvent.STAGECODE)
            } else if (
                eventAction === 'goToDefinition' ||
                eventAction === 'goToDefinition.preloaded' ||
                eventAction === 'hover'
            ) {
                logUserEvent(UserEvent.CODEINTEL)
            } else if (eventAction === 'SavedSearchEmailClicked' || eventAction === 'SavedSearchSlackClicked') {
                logUserEvent(UserEvent.STAGEVERIFY)
            } else if (eventAction === 'DiffSearchResultsQueried') {
                logUserEvent(UserEvent.STAGEMONITOR)
            }
        }
        logEvent(eventAction, eventProperties, publicArgument)
    }
}

export const serverAdmin = new ServerAdminWrapper()
