import {AbstractLayer} from '../../core/layers/abstract.layer';
import {LineLayer} from '../../core/layers/line.layer';
import {AbstractTool} from './abstract.tool';
import { LVGLPlatform } from '/src/platforms/lvgl';

export class LineTool extends AbstractTool {
    name: string = 'line';

    createLayer(): AbstractLayer {
        const {session} = this.editor;
        const renderer = session.createRenderer();
        return new LineLayer(session.getPlatformFeatures(), renderer);
    }

    isSupported(platform: string): boolean {
        return ![LVGLPlatform.id].includes(platform);
    }
}
