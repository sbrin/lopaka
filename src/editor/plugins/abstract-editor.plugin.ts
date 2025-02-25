import {Keys} from '../../core/keys.enum';
import {Point} from '../../core/point';
import {Session} from '../../core/session';

/**
 * Base class for all editor plugins
 */
export abstract class AbstractEditorPlugin {
    captured: boolean;
    constructor(
        protected session: Session,
        protected container: HTMLElement
    ) {}
    onMouseClick(point: Point, event: MouseEvent | TouchEvent): void {}
    onMouseDown(point: Point, event: MouseEvent | TouchEvent): void {}
    onMouseMove(point: Point, event: MouseEvent | TouchEvent): void {}
    onMouseUp(point: Point, event: MouseEvent | TouchEvent): void {}
    onMouseLeave(point: Point, event: MouseEvent | TouchEvent): void {}
    onMouseDoubleClick(point: Point, event: MouseEvent): void {}
    onKeyDown(key: Keys, event: KeyboardEvent): void {}
    onDrop(point: Point, event: DragEvent): void {}
    onClear(): void {}
}
