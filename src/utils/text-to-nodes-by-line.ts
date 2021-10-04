import { parse } from 'postcss-scss';
import { Declaration as PostCSSDeclaration } from 'postcss'

import {
    Declaration,
    DeclarationType,
    GLOBAL_LITERAL_REG_EXP,
    VALUE_WITH_CSS_VARIABLE,

} from '../types'

export type DeclarationsByLine = Record<number|string, Declaration[]>

/**
 * Parses scss/css document and returns map of all identifiers by lines.
 *
 * Example:
 *
 * ```
 * .hello {
 *     display: flex;
 *     color: red;
 * }
 * ```
 *
 * Returned value would be
 * ```
 * {
 *  1: [displayToken],
 *  2: [colorToken, redToken]
 * }
 * ```
 *
 * @param text - Current scss/css document
 */
export function textToNodesByLine(text: string): DeclarationsByLine {
    try {
        const ast = parse(text)
        const declarations: Declaration[] = []

        // Iterate over all CSS declaration (omit comment and rules) statements
        ast.walkDecls(declaration => {
            const propertyNode: Declaration = {
                type: DeclarationType.CommonDeclaration,
                value: declaration.prop,
                start: declaration.source?.start,
                next: {
                    offset: (declaration.source?.start?.offset ?? 0) + declaration.prop.length,
                    column: (declaration.source?.start?.column ?? 0) + declaration.prop.length,
                    line: declaration.source?.start?.line ?? 0,
                }
            }

            // Extract from value tokens that we support
            const variablesTokens: Declaration[] = [...declaration.value.matchAll(VALUE_WITH_CSS_VARIABLE)]
                // Take first match group (only --var-name without var() call expression)
                .map(match => ({
                    type: DeclarationType.DeclarationWithVariables,
                    value: match[1],
                    ...createMatchPosition(match[1], (match.index ?? 0) + match[0].indexOf(match[1]) - 1, declaration)
                }))

            const cssColorsTokens: Declaration[]  = [...declaration.value.matchAll(GLOBAL_LITERAL_REG_EXP)]
                .map(match => ({
                    type: DeclarationType.DeclarationWithColorLiteral,
                    value: match[0],
                    ...createMatchPosition(match[0], match.index, declaration)
                }))

            declarations.push(...[propertyNode, ...variablesTokens, ...cssColorsTokens])
        })

        // Group declarations by lines
        return declarations.reduce((accumulator, current) => {
            const startLine = current.start?.line

            if (!startLine) {
                return accumulator
            }

            let tokens = accumulator[startLine]

            if (!tokens) {
                tokens = []
                accumulator[startLine] = tokens
            }

            tokens.push(current)

            return accumulator
        }, {} as DeclarationsByLine)
    } catch (error) {
        console.log('POSTCSS parser error', error)
    }

    return {}
}

type MatchPosition = Pick<Declaration, 'start' | 'next'>

function createMatchPosition(value: string, matchIndex: number | undefined, declaration: PostCSSDeclaration): MatchPosition {
    const valueStartIndex = `${declaration.prop}${declaration.raws.between ?? ''}`.length
    const matchStartIndex = valueStartIndex + (matchIndex ?? 0)
    const matchEndIndex = matchStartIndex + (value.length ?? 0)

    return {
        start: {
            offset: (declaration.source?.start?.offset ?? 0) + matchStartIndex,
            column: (declaration.source?.start?.column ?? 0) + matchStartIndex,
            line: declaration.source?.start?.line ?? 0,
        },
        next: {
            offset: (declaration.source?.start?.offset ?? 0) + matchEndIndex,
            column: (declaration.source?.start?.column ?? 0) + matchEndIndex,
            line: declaration.source?.start?.line ?? 0,
        },
    }
}
