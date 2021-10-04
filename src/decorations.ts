import sourcegraph, { TextDocumentDecoration } from 'sourcegraph';

import { DeclarationsByLine } from './utils/text-to-nodes-by-line';
import { Declaration, DeclarationType, DeclarationWithColorLiteral } from './types';
import { getNodeRange } from './utils/get-node-range';

const propertyInfoDecorationType = sourcegraph.app.createDecorationType()

const getAllEditors = (): sourcegraph.ViewComponent[] =>
    sourcegraph.app.windows.flatMap(window => window.visibleViewComponents)

export function renderColorInlinePreview(declarations: Map<string, DeclarationsByLine | undefined>) {
    const editors = getAllEditors()

    for (const editor of editors) {
        try {

            if (editor.type !== 'CodeEditor') {
                continue;
            }

            const tokens = declarations.get(editor.document.uri)

            if (!tokens) {
                continue;
            }

            const colorsDecorations: TextDocumentDecoration[] = Object.keys(tokens)
                .flatMap<Declaration>(key => tokens[key])
                .filter((declaration): declaration is DeclarationWithColorLiteral =>
                    declaration.type === DeclarationType.DeclarationWithColorLiteral
                )
                .map(declaration => ({
                    range: getNodeRange(declaration),
                    after: {
                        backgroundColor: `${declaration.value}`,
                        hoverMessage: `Color preview of ${declaration.value}`,
                        contentText: '  ',
                    },
                    isWholeLine: true,
                }))

            editor.setDecorations(propertyInfoDecorationType, colorsDecorations)
        } catch (error) {
            console.error('CSS Properties extension error:', error)
        }
    }
}
