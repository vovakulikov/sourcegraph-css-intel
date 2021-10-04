import { Position } from 'postcss'

export enum DeclarationType {
    /**
     * CSS declaration with literal color token in decl value
     * Example: color: #fff;
     */
    DeclarationWithColorLiteral = 'DeclarationWithColorLiteral',

    /**
     * CSS declaration with literal css variables usage value
     * Example: color: var(--font-color);
     */
    DeclarationWithVariables = 'DeclarationWithVariables',

    /**
     * CSS declaration
     * Example: font-size: 1rem;
     */
    CommonDeclaration = 'CommonDeclaration'
}

/**
 * Scss token node representation. Scss-parser types package is wrong
 * we have to override them explicitly.
 */
export interface Node {
    /**
     * Value of declaration (like 'none', '#fff', '12rem'
     */
    value: string

    start?: Position
    next?: Position
}

export interface DeclarationWithColorLiteral extends Node {
    type: DeclarationType.DeclarationWithColorLiteral
}

export interface DeclarationWithVariables extends Node {
    type: DeclarationType.DeclarationWithVariables
}

export interface CommonDeclaration extends Node {
    type: DeclarationType.CommonDeclaration
}

export type Declaration = CommonDeclaration | DeclarationWithVariables | DeclarationWithColorLiteral

// Helpers
/**
 * Based on conversations here https://gist.github.com/olmokramer/82ccce673f86db7cda5e#gistcomment-2243862
 */
export const LITERAL_REG_EXP = /(#(?:[0-9a-f]{2}){2,4}|(#[0-9a-f]{3})|(rgb|hsl)a?\((-?\d+%?[,\s]+){2,3}\s*[\d\.]+%?\))/i
export const GLOBAL_LITERAL_REG_EXP = /(#(?:[0-9a-f]{2}){2,4}|(#[0-9a-f]{3})|(rgb|hsl)a?\((-?\d+%?[,\s]+){2,3}\s*[\d\.]+%?\))/gi

export function hasLiteralColorToken(node: Node): boolean {
    return LITERAL_REG_EXP.test(node.value)
}

export const VALUE_WITH_CSS_VARIABLE = /var\((.*?)\)/gi

export function hasVariableToken(node: Node): boolean {
    return VALUE_WITH_CSS_VARIABLE.test(node.value)
}
