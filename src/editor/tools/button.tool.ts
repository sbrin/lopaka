import {AbstractLayer} from '../../core/layers/abstract.layer';
import {EllipseLayer} from '../../core/layers/ellipse.layer';
import {TFTeSPIPlatform} from '../../platforms/tft-espi';
import {U8g2Platform} from '../../platforms/u8g2';
import {Uint32RawPlatform} from '../../platforms/uint32-raw';
import {AbstractTool} from './abstract.tool';
import {LVGLPlatform} from '/src/platforms/lvgl';

// #2196f3

export class EllipseTool extends AbstractTool {
    name = 'button';

    createLayer(): AbstractLayer {
        const {session} = this.editor;
        return new EllipseLayer(session.getPlatformFeatures());
    }

    isSupported(platform: string): boolean {
        return [LVGLPlatform.id].includes(platform);
    }
}
