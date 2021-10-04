import * as sourcegraph from 'sourcegraph'
import debounce from 'lodash/debounce'

import { DeclarationsByLine, textToNodesByLine } from './utils/text-to-nodes-by-line';

import { renderHover } from './hoverify/render-hover';
import { renderColorInlinePreview } from './decorations';

// Add color live preview inline annotations
const addInlineColorAnnotations: typeof renderColorInlinePreview = debounce(
    renderColorInlinePreview,
    600,
    { maxWait: 1500, trailing: true }
)

/**
 * Global cache of all opened and parsed documents (declarations) in
 * Sourcegraph blob views.
 */
export const declarationsStore = new Map<string, DeclarationsByLine | undefined>()

/**
 * The main entry point to the extension codebase. This function will be run by
 * sg extension platform in sourcegraph web-worker environment.
 *
 * @param context - Sourcegraph API
 */
export function activate(context: sourcegraph.ExtensionContext): void {

    // Listen all blob opened text documents and parse them in case if a document
    // has a supported format (scss, css)
    context
        .subscriptions
        .add(
            sourcegraph
                .workspace
                .openedTextDocuments
                .subscribe((document: sourcegraph.TextDocument) => {
                    const isDocumentSupported = document.languageId === 'css' || document.languageId === 'scss'

                    if (isDocumentSupported && typeof document.text === 'string') {
                        try {
                            const lines = textToNodesByLine(document.text)

                            // Add document lines data when a user opens the blob page
                            declarationsStore.set(document.uri, lines)
                        } catch (error) {
                            // In case of parsing error
                            console.error('CSS Properties extension error:', error)
                        }
                    }

                    addInlineColorAnnotations(declarationsStore)
                })
        )

    // Cold run with all available editors
    addInlineColorAnnotations(declarationsStore)

    // Provide hover information about hovered token
    context.subscriptions.add(
        sourcegraph.languages.registerHoverProvider([{ language: 'css' }, { language: 'scss' }], {
            provideHover: (document: sourcegraph.TextDocument, position: sourcegraph.Position) => {
                const { line: zeroIndexLine, character } = position

                try {

                    // convert to 1-indexed position
                    const position = { line: zeroIndexLine + 1, character }
                    const declarations = declarationsStore.get(document.uri)

                    if (!declarations) {
                        return null
                    }

                    const nodesAtLine = declarations[position.line]

                    if (!nodesAtLine) {
                        return null
                    }

                    return renderHover(nodesAtLine, position, document.uri)
                } catch {
                    return null
                }
            },
        })
    )
}

