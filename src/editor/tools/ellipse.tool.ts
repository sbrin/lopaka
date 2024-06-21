import {AbstractLayer} from '../../core/layers/abstract.layer';
import {EllipseLayer} from '../../core/layers/ellipse.layer';
import { TFTeSPIPlatform } from "../../platforms/tft-espi";
import {U8g2Platform} from '../../platforms/u8g2';
import {Uint32RawPlatform} from '../../platforms/uint32-raw';
import {AbstractTool} from './abstract.tool';

export class EllipseTool extends AbstractTool {
    name = 'ellipse';

    createLayer(): AbstractLayer {
        const {session} = this.editor;
        return new EllipseLayer(session.getPlatformFeatures());
    }

    isSupported(platform: string): boolean {
        return [U8g2Platform.id, Uint32RawPlatform.id, TFTeSPIPlatform.id].includes(platform);
    }
}
