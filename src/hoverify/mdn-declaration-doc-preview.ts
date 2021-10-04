import sourcegraph from 'sourcegraph';

import { Declaration } from '../types';
import { getNodeRange } from '../utils/get-node-range';

const MDN_GITHUB_SOURCE = 'https://raw.githubusercontent.com/mdn/content/main/files/en-us/web/css'

/**
 * MDN Preview tooltip renderer. Fetches and renders documentation from the MDN
 * about CSS declaration rules.
 */
export async function renderMDNPreview(declaration: Declaration): Promise<sourcegraph.Badged<sourcegraph.Hover> | null> {
    try {
        const response = await fetch(`${MDN_GITHUB_SOURCE}/${declaration.value}/index.md`)

        if (!response.ok) {
            throw new Error('CSS token was not found on MDN')
        }

        const info = await response.text()

        return {
            contents: {
                value: `${getProcessedText(info, declaration.value) ?? ''}`,
                kind: sourcegraph.MarkupKind.Markdown,
            },
            range: getNodeRange(declaration),
            aggregableBadges: [{ text: 'MDN' }]
        }
    } catch (error) {
        console.error('MDN content loading error', error)
    }

    return null
}

function getProcessedText(markdownText: string, tokenName: string): string {
    const text = markdownText
        // Remove first block rounded with ---
        .split('---')
        .slice(2)
        .join('')
        // Remove title block with MDN meta info
        .replace(/(--- .+? ---)/g,'')
        // Replace MDN specific cross pages links
        .replace(/({{cssxref\()(.+?)(\)}})/g, '[$2](/en-US/docs/Web/CSS/$2)')
        // Remove global MDN specific extension variable tags
        .replace(/({{.+?}})/g,'')
        // Take only first paragraph from the description block
        .split('##')
        .slice(0, 1)
        .join('')
        .trim()
        .replaceAll(/\[(.*?)]\((.*?)\)/gim, '[$1](https://developer.mozilla.org$2)')

    return text + `<footer>[Learn more on MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/${tokenName})</footer>`
}
