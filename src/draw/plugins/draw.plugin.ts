import {Point} from '../../core/point';
import {Session} from '../../core/session';
/**
 * Base class for all draw plugins
 */
export abstract class DrawPlugin {
    constructor(protected session: Session) {}

    public abstract update(ctx: CanvasRenderingContext2D, position: Point): void;
}
