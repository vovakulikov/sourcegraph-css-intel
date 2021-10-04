import sourcegraph from 'sourcegraph';

import {
    Declaration,
    DeclarationType,
} from '../types';

import { renderCssVariableSuggestion } from './css-variables-intel';
import { renderColorLiteralPreview } from './color-literal-intel';
import { renderMDNPreview } from './mdn-declaration-doc-preview';

type HoverHandler = (declaration: Declaration, documentURI: string) =>
    Promise<sourcegraph.Badged<sourcegraph.Hover> | null>

/**
 * Dictionary of hover handlers for all supported declaration types.
 */
const NODE_HOVER_HANDLERS: Record<DeclarationType, HoverHandler> = {

    [DeclarationType.DeclarationWithVariables]: renderCssVariableSuggestion,
    [DeclarationType.DeclarationWithColorLiteral]: renderColorLiteralPreview,
    [DeclarationType.CommonDeclaration]: renderMDNPreview
}

/**
 * Return code intel tooltip content based on hovered scss/css token. In case
 * when we don't have anything to render return null
 *
 * @param nodes - Filtered nodes array (identifiers and color tokens)
 * @param position - Information about hovered document token (line, position)
 * @param documentURI - Opened in blob view document URL
 */
export async function renderHover(
    nodes: Declaration[],
    position: { line: number; character: number },
    documentURI: string
): Promise<sourcegraph.Badged<sourcegraph.Hover> | null> {
    // If not hovering over an identifier, try to make sense
    // of the whole line (e.g. rgba color previews, color names, margin or padding previews)
    const node = nodes.find(node => {
        if (node.start) {
            if (position.character + 1 >= node.start.column) {
                if (!node.next) {
                    return true
                }
                if (position.character < node.next.column) {
                    return true
                }
            }
        }
        return false
    })

    if (!node) {
        return null
    }

    try {
        const handler = NODE_HOVER_HANDLERS[node.type]

        return await handler(node, documentURI)
    } catch (error) {
        console.warn('CSS Properties Extension error:', error)
    }

    return null
}

