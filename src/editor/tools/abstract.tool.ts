import {AbstractLayer} from '../../core/layers/abstract.layer';
import {Point} from '../../core/point';
import {Editor} from '../editor';

export abstract class AbstractTool {
    // tool name
    protected name: string;

    abstract createLayer(): AbstractLayer;

    constructor(protected editor: Editor) {}

    getName(): string {
        return this.name;
    }

    isEnabled(): boolean {
        return true;
    }

    onStopEdit(layer: AbstractLayer, position: Point, originalEvent: MouseEvent): void {
        // do nothing
    }

    onStartEdit(layer: AbstractLayer, position: Point, originalEvent: MouseEvent): void {
        // do nothing
    }
}
