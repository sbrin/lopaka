import {Session} from '../../core/session';

export abstract class VirtualScreenPlugin {
    constructor(protected session: Session) {}

    public abstract update(ctx: CanvasRenderingContext2D): void;
}
