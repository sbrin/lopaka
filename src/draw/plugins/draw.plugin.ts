import {Point} from '../../core/point';
import {Session} from '../../core/session';
/**
 * Base class for all draw plugins
 */
export abstract class DrawPlugin {
    static offset: Point = new Point(25, 25);
    constructor(protected session: Session) {}

    public abstract update(ctx: CanvasRenderingContext2D, point: Point): void;
}
