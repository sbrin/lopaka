import {AbstractLayer} from '../../core/layers/abstract.layer';
import {TriangleLayer} from '../../core/layers/triangle.layer';
import {AbstractTool} from './abstract.tool';
import {U8g2Platform} from '/src/platforms/u8g2';
import {AdafruitPlatform} from '/src/platforms/adafruit';
import {AdafruitMonochromePlatform} from '/src/platforms/adafruit_mono';
import {ArduinoGFXPlatform} from '/src/platforms/arduinogfx';
import {TFTeSPIPlatform} from '/src/platforms/tft-espi';
import {EsphomePlatform} from '/src/platforms/esphome';
import {FlipperPlatform} from '/src/platforms/flipper';
import {GxEPD2Platform} from '/src/platforms/gxepd2';
import {InkplatePlatform} from '/src/platforms/inkplate';
import {MicropythonPlatform} from '/src/platforms/micropython';

export class TriangleTool extends AbstractTool {
    name = 'triangle';
    title = 'Triangle';

    createLayer(): AbstractLayer {
        const {session} = this.editor;
        const renderer = session.createRenderer();
        return new TriangleLayer(session.getPlatformFeatures(), renderer);
    }

    isSupported(platform: string): boolean {
        return [
            U8g2Platform.id,
            AdafruitPlatform.id,
            AdafruitMonochromePlatform.id,
            ArduinoGFXPlatform.id,
            TFTeSPIPlatform.id,
            EsphomePlatform.id,
            FlipperPlatform.id,
            GxEPD2Platform.id,
            InkplatePlatform.id,
            MicropythonPlatform.id,
        ].includes(platform);
    }
}
