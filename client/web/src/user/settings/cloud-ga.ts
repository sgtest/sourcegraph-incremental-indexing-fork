import { AuthenticatedUser } from '../../auth'
import { UserAreaUserFields, Scalars } from '../../graphql-operations'

type Scopes = string[] | null

export interface UserProps {
    user: Pick<UserAreaUserFields, 'id' | 'tags' | 'builtinAuth'>
    authenticatedUser: Pick<AuthenticatedUser, 'id' | 'tags'>
}

export interface Owner {
    id: Scalars['ID']
    type: 'user' | 'org'
    tags?: string[]
    name?: string
}

export const externalServiceUserMode = (props: UserProps): 'disabled' | 'public' | 'all' | 'unknown' =>
    externalServiceUserModeFromTags(props.user.tags || [])

export const userExternalServicesEnabled = (props: UserProps): boolean => modeEnabled(externalServiceUserMode(props))

export const userExternalServicesEnabledFromTags = (tags: string[]): boolean =>
    modeEnabled(externalServiceUserModeFromTags(tags))

export const showPasswordsPage = (props: UserProps): boolean => {
    // user is signed-in with builtin Auth and External Service is not public
    const mode = externalServiceUserMode(props)
    return props.user.builtinAuth && (mode === 'disabled' || mode === 'unknown')
}

export const showAccountSecurityPage = (props: UserProps): boolean => !showPasswordsPage(props)

export const externalServiceUserModeFromTags = (tags?: string[]): 'disabled' | 'public' | 'all' | 'unknown' => {
    const siteMode = window.context.externalServicesUserMode
    if (siteMode === 'all') {
        // Site mode already allows all repo types, no need to check user tags
        return siteMode
    }
    if (tags?.includes('AllowUserExternalServicePrivate')) {
        return 'all'
    }
    if (tags?.includes('AllowUserExternalServicePublic')) {
        return 'public'
    }
    return siteMode
}

// If the user is allowed to add private code but they don't have the 'repo' scope
// then we need to request it.
export const githubRepoScopeRequired = (tags: string[] = [], scopes?: Scopes): boolean =>
    requiredScope('repo', tags, scopes)

// If the user is allowed to add private code but they don't have the 'api' scope
// then we need to request it.
export const gitlabAPIScopeRequired = (tags: string[] = [], scopes?: Scopes): boolean =>
    requiredScope('api', tags, scopes)

export const gitlabTokenExpired = (config?: string): boolean => {
    if (!config) {
        return false
    }

    try {
        const jsonConfig = JSON.parse(config)
        const key = 'token.oauth.expiry'
        if (jsonConfig['token.type'] === 'oauth') {
            const tokenExpiry = jsonConfig[key] || 0
            const currentTimeUnix = Math.round(new Date().getTime() / 1000) - 10
            return !tokenExpiry || tokenExpiry < currentTimeUnix
        }
        return false
    } catch {
        // return false in case JSON cannot be parsed
        return false
    }
}

const requiredScope = (scope: string, tags: string[], scopes?: Scopes): boolean => {
    const allowedPrivate = externalServiceUserModeFromTags(tags) === 'all'
    if (!Array.isArray(scopes)) {
        return false
    }
    return allowedPrivate && !scopes.includes(scope)
}

const modeEnabled = (mode: string): boolean => mode === 'all' || mode === 'public'
