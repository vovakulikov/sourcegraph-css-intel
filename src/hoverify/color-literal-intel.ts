import sourcegraph from 'sourcegraph';

import { Declaration } from '../types';
import { getNodeRange } from '../utils/get-node-range';

// eslint-disable-next-line @typescript-eslint/require-await
export async function renderColorLiteralPreview(declaration: Declaration): Promise<sourcegraph.Badged<sourcegraph.Hover> | null> {
    return {
        contents: {
            value: `<h4>Color preview</h4>
                        <svg width="100" height="100">
                            <rect width="100" height="100" fill="${declaration.value}" />
                         </svg>
                         <div>&#8203</div>
               `,
            kind: sourcegraph.MarkupKind.Markdown,
        },
        range: getNodeRange(declaration),
    }
}
