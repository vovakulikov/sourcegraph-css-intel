import sourcegraph from 'sourcegraph';
import escapeRegExp from 'lodash/escapeRegExp';

import { Declaration } from '../types';
import { fetchHighlightedFileLineRanges, searchVariableDefinition } from '../api/search';
import { getNodeRange } from '../utils/get-node-range';
import { resolveRepositoryURI } from '../utils/resolve-repository-uri';

export async function renderCssVariableSuggestion(declaration: Declaration, documentURI: string): Promise<sourcegraph.Badged<sourcegraph.Hover> | null> {
    // Build search query with css variable
    const url = new URL('/search', sourcegraph.internal.sourcegraphURL)
    const repositoryURL = resolveRepositoryURI(new URL(documentURI))
    const repoFilter = `repo:^(${escapeRegExp(repositoryURL)})$`

    url.searchParams.set('q', `${repoFilter} ${declaration.value}:`)

    const { repository, lineNumber, filePath, commitID, } = await searchVariableDefinition({
        query: `${repoFilter} ${declaration.value}: count:all`
    })

    const previews = await fetchHighlightedFileLineRanges({
        filePath,
        commitID,
        repoName: repository,
        disableTimeout: false,
        ranges: {
            startLine: lineNumber - 1,
            endLine: lineNumber + 2
        }
    })

    const declarationTokenRegExp = new RegExp(`(${declaration.value})`, 'gmi')
    const processedPreviews = previews.map(preview => {
        const matchers = [...preview.matchAll(/<td(.*?)>(.|\n)*?<\/td>/gim)]
        const lineNumberMatch = [...preview.matchAll(/line="(.*?)"/gim)]

        return `
                <tr>
                    <td>${lineNumberMatch[0][1]}</td>
                    ${matchers[1][0].replace(declarationTokenRegExp, "<span class='selection-highlight'>$1<span>")}
                </tr>
            `
    })

    const cssVariableURL = new URL(`/${repositoryURL}/-/blob/${filePath}`, sourcegraph.internal.sourcegraphURL)
    cssVariableURL.searchParams.set(`L${lineNumber + 1}`, '')

    return {
        contents: {
            value: `<div>
                        <a href="${cssVariableURL.href}" class="d-inline-block mb-2">${filePath}</a>
                        <code class="code-excerpt d-flex flex-column file-match-children__item-code-excerpt">
                            <table class="table-hello">
                               <tbody>
                                 ${processedPreviews.join('')}
                               </tbody>
                            </table>
                        </code>
                        <a class="mt-3 mb-2 btn btn-secondary" href="${url.href}">Search variable</a>
                    </div>
                   `,
            kind: sourcegraph.MarkupKind.Markdown,
        },
        range: getNodeRange(declaration),
    }
}
