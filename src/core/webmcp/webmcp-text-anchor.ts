/**
 * Text layers store their position as the baseline origin: for an unrotated
 * string the drawn box sits above it, and for rotated text it sits to one side.
 * Other layer types keep the native coordinate semantics of their modifiers.
 *
 * WebMCP hides that difference. An agent cannot know the font metrics that set
 * the offset, so for text layers the adapter treats x/y as the top-left corner
 * of the rendered text in all three directions: creation, reads, and updates.
 *
 * The correction is never hard-coded. After the layer carries its final text,
 * font, size and rotation, the offset is read back from the layer itself as
 * `position - bounds.pos`, which holds for any font and any rotation.
 */

import type {AbstractLayer} from '../layers/abstract.layer';
import {Point} from '../point';

/** Text is the only layer type whose stored position is not its top-left corner. */
export function isWebMcpTextAnchored(layer: {getType?(): string}): boolean {
    return typeof layer?.getType === 'function' && layer.getType() === 'string';
}

/**
 * Distance from the layer's top-left bounds corner to its stored position,
 * measured on the layer in its current state.
 */
function anchorOffset(layer: AbstractLayer): Point {
    const bounds = layer.bounds;
    const position = (layer as unknown as {position?: Point}).position;
    if (!bounds || !position) return new Point(0, 0);
    return new Point(position.x - bounds.x, position.y - bounds.y);
}

/**
 * Move a text layer so its top-left bounds corner lands on the requested
 * point. Coordinates left undefined keep their current value.
 */
export function applyWebMcpTextTopLeft(layer: AbstractLayer, x?: number, y?: number): void {
    if (!isWebMcpTextAnchored(layer)) return;
    layer.updateBounds();
    const offset = anchorOffset(layer);
    const target = new Point(x ?? layer.bounds.x, y ?? layer.bounds.y).round();
    const position = (layer as unknown as {position: Point}).position;
    position.x = target.x + offset.x;
    position.y = target.y + offset.y;
    position.round();
    layer.updateBounds();
    layer.draw();
}

/** Top-left corner reported to the agent in place of the stored position. */
export function webMcpTextTopLeft(layer: AbstractLayer): Point | null {
    if (!isWebMcpTextAnchored(layer) || !layer.bounds) return null;
    return new Point(layer.bounds.x, layer.bounds.y);
}
