
export function resolveRepositoryURI(uri: URL): string {
    if (uri.protocol !== 'git:') {
        throw new Error(`Unsupported protocol: ${uri.protocol}`)
    }
    const repo = (uri.host + decodeURIComponent(uri.pathname)).replace(/^\/*/, '')
    const revision = decodeURIComponent(uri.search.slice(1))

    if (!revision) {
        throw new Error('Could not determine revision')
    }

    return repo
}
