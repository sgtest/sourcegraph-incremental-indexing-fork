import * as GQL from '@sourcegraph/shared/src/schema'

/**
 * Common props for components underneath a namespace (e.g., a user or organization).
 */
export interface NamespaceProps {
    /**
     * The namespace.
     */
    namespace: Pick<GQL.Namespace, '__typename' | 'id' | 'url'>
}
