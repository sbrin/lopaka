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

    isSupported(platform: string): boolean {
        return true;
    }

    onActivate(): void {}

    onDeactivate(): void {
        // do nothing
    }

    onStopEdit(layer: AbstractLayer, position: Point, originalEvent: MouseEvent): void {
        this.editor.state.activeLayer = null;
        this.editor.state.activeTool = null;
    }

    onStartEdit(layer: AbstractLayer, position: Point, originalEvent: MouseEvent): void {
        // do nothing
    }
}
