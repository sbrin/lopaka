import {Point} from '../../core/point';
import {Session} from '../../core/session';
/**
 * Base class for all draw plugins
 */
export abstract class DrawPlugin {
    static offset: Point = new Point(30, 30);
    constructor(protected session: Session) {}

    public abstract update(ctx: CanvasRenderingContext2D, point: Point, event: MouseEvent): void;
}
