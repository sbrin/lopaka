import { AbstractLayer } from '../../core/layers/abstract.layer';
import { TriangleLayer } from '../../core/layers/triangle.layer';
import { AbstractTool } from './abstract.tool';
import { Point } from '../../core/point';
import { U8g2Platform } from '/src/platforms/u8g2';
import { AdafruitPlatform } from '/src/platforms/adafruit';
import { AdafruitMonochromePlatform } from '/src/platforms/adafruit_mono';
import { ArduinoGFXPlatform } from '/src/platforms/arduinogfx';
import { TFTeSPIPlatform } from '/src/platforms/tft-espi';
import { EsphomePlatform } from '/src/platforms/esphome';
import { FlipperPlatform } from '/src/platforms/flipper';
import { GxEPD2Platform } from '/src/platforms/gxepd2';
import { InkplatePlatform } from '/src/platforms/inkplate';
import { MicropythonPlatform } from '/src/platforms/micropython';
import { FreestylePlatform } from '/src/platforms/freestyle';

export class TriangleTool extends AbstractTool {
    private static readonly MIN_CLICK_SIZE = 5;

    name = 'triangle';
    title = 'Triangle';

    createLayer(): AbstractLayer {
        const { session } = this.editor;
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
            GxEPD2Platform.id,
            InkplatePlatform.id,
            MicropythonPlatform.id,
            FreestylePlatform.id,
        ].includes(platform);
    }

    onStopEdit(layer: AbstractLayer, position: Point, originalEvent: MouseEvent | TouchEvent): void {
        const triangle = layer as TriangleLayer;
        const isCollapsed =
            triangle.bounds.w <= 1 &&
            triangle.bounds.h <= 1 &&
            triangle.p1.equals(triangle.p2) &&
            triangle.p2.equals(triangle.p3);

        if (isCollapsed) {
            const size = TriangleTool.MIN_CLICK_SIZE;
            const halfWidth = Math.floor(size / 2);
            triangle.p1 = position.clone().add(halfWidth, 0);
            triangle.p2 = position.clone().add(size - 1, size - 1);
            triangle.p3 = position.clone().add(0, size - 1);
            triangle.updateBounds();
            triangle.draw();
        }

        super.onStopEdit(layer, position, originalEvent);
    }
}
