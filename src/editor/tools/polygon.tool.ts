import { AbstractLayer, EditMode } from '../../core/layers/abstract.layer';
import { PolygonLayer } from '../../core/layers/polygon.layer';
import { Point } from '../../core/point';
import { AbstractTool } from './abstract.tool';
import { U8g2Platform } from '/src/platforms/u8g2';
import { AdafruitPlatform } from '/src/platforms/adafruit';
import { AdafruitMonochromePlatform } from '/src/platforms/adafruit_mono';
import { ArduinoGFXPlatform } from '/src/platforms/arduinogfx';
import { TFTeSPIPlatform } from '/src/platforms/tft-espi';
import { FlipperPlatform } from '/src/platforms/flipper';
import { MicropythonPlatform } from '/src/platforms/micropython';
import { EsphomePlatform } from '/src/platforms/esphome';

export class PolygonTool extends AbstractTool {
    name: string = 'polygon';
    private creating: boolean = false;

    private finalizePolygon(layer: AbstractLayer): boolean {
        const poly = layer as PolygonLayer;
        if (poly.points.length > 2) {
            poly.points.pop();
        }
        if (poly.points.length > 2) {
            poly.points.pop();
        }
        this.creating = false;
        return poly.points.length >= 3;
    }

    private cancelPolygon(layer: AbstractLayer): boolean {
        const poly = layer as PolygonLayer;
        if (poly.points.length > 1) {
            poly.points.pop();
        }
        this.creating = false;
        return poly.points.length >= 2;
    }

    createLayer(): AbstractLayer {
        const { session } = this.editor;
        return new PolygonLayer(session.getPlatformFeatures());
    }

    isSupported(platform: string): boolean {
        // Keep polygon disabled on platforms without polygon code generation support such as LVGL.
        return [
            U8g2Platform.id,
            AdafruitPlatform.id,
            AdafruitMonochromePlatform.id,
            ArduinoGFXPlatform.id,
            TFTeSPIPlatform.id,
            FlipperPlatform.id,
            MicropythonPlatform.id,
            EsphomePlatform.id,
        ].includes(platform);
    }

    isMultiClick(): boolean {
        return true;
    }

    onStartEdit(layer: AbstractLayer, position: Point, originalEvent: MouseEvent): void {
        const poly = layer as PolygonLayer;
        if (this.creating) {
            poly.addPoint(position);
        } else {
            this.creating = true;
        }
    }

    onStopEdit(layer: AbstractLayer, position: Point, originalEvent: MouseEvent): void {
        this.finalizePolygon(layer);
    }

    finalizeCreate(layer: AbstractLayer, position: Point, originalEvent: MouseEvent | TouchEvent): boolean {
        return this.finalizePolygon(layer);
    }

    cancelCreate(layer: AbstractLayer): boolean {
        return this.cancelPolygon(layer);
    }

    onActivate(): void {
        this.creating = false;
    }

    onDeactivate(): void {
        const { state } = this.editor;
        if (state.activeLayer instanceof PolygonLayer) {
            const poly = state.activeLayer as PolygonLayer;
            if (poly.points.length > 2) {
                poly.points.pop();
            }
            poly.stopEdit();
            poly.draw();
            poly.selected = true;
            state.activeLayer = null;
        }
        this.creating = false;
    }
}
