import {AbstractLayer} from 'src/core/layers/abstract.layer';
import {RectangleLayer} from '../../core/layers/rectangle.layer';
import {AbstractTool} from './abstract.tool';
import {LVGLPlatform} from '/src/platforms/lvgl';

export class RectTool extends AbstractTool {
    name = 'rect';
    title = 'Rectangle';

    createLayer(): AbstractLayer {
        const {session} = this.editor;
        const renderer = session.createRenderer();
        return new RectangleLayer(session.getPlatformFeatures(), renderer);
    }

    isSupported(platform: string): boolean {
        return ![LVGLPlatform.id].includes(platform);
    }
}
