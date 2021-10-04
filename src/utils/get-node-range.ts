import sourcegraph from 'sourcegraph';

import { Node } from '../types';

/**
 * Returns converted to first 1 element range of CSS token.
 */
export function getNodeRange(node: Node): sourcegraph.Range {
    if (!node?.start || !node.next) {
        throw new Error('Node has no source position')
    }

    // Convert to
    const start = new sourcegraph.Position(node.start.line - 1, node.start.column)
    const end = new sourcegraph.Position(node.next.line - 1, node.next.column - 1)

    return new sourcegraph.Range(start, end)
}
