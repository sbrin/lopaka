import {AbstractLayer} from '../../core/layers/abstract.layer';
import {CircleLayer} from '../../core/layers/circle.layer';
import { TFTeSPIPlatform } from "../../platforms/tft-espi";
import {U8g2Platform} from '../../platforms/u8g2';
import {Uint32RawPlatform} from '../../platforms/uint32-raw';
import {AbstractTool} from './abstract.tool';

export class CircleTool extends AbstractTool {
    name = 'circle';

    createLayer(): AbstractLayer {
        const {session} = this.editor;
        return new CircleLayer(session.getPlatformFeatures());
    }

    isSupported(platform: string): boolean {
        return ![U8g2Platform.id, Uint32RawPlatform.id, TFTeSPIPlatform.id].includes(platform);
    }
}
