import {FlipperPlatform} from '../../platforms/flipper';
import {TLayerState} from '../layers/abstract.layer';
import {BoxLayer} from '../layers/box.layer';
import {CircleLayer} from '../layers/circle.layer';
import {DiscLayer} from '../layers/disc.layer';
import {DotLayer} from '../layers/dot.layer';
import {FrameLayer} from '../layers/frame.layer';
import {IconLayer} from '../layers/icon.layer';
import {LineLayer} from '../layers/line.layer';
import {PaintLayer} from '../layers/paint.layer';
import {TextLayer} from '../layers/text.layer';
import {Session} from '../session';

export type TProject = {
    display: string;
    platform: string;
    layers: TLayerState[];
    scale: number;
};

export const LayerClassMap: {[key in ELayerType]: any} = {
    box: BoxLayer,
    circle: CircleLayer,
    disc: DiscLayer,
    dot: DotLayer,
    frame: FrameLayer,
    icon: IconLayer,
    line: LineLayer,
    string: TextLayer,
    paint: PaintLayer
};

export abstract class AbstractProvider {
    autosave: boolean = true;
    protected autosaveInterval: number = 60 * 1000 * 2;

    constructor(protected session: Session) {
        setInterval(() => {
            if (this.autosave) {
                this.saveProject();
            }
        }, this.autosaveInterval);
    }

    loadLayers(layers: Partial<TLayerState>[]) {
        layers.forEach((l) => {
            const type: ELayerType = l.t;
            if (type in LayerClassMap) {
                const layer = new LayerClassMap[type]();
                layer.loadState(l);
                layer.stopEdit();
                this.session.addLayer(layer);
            }
        });
        this.session.virtualScreen.redraw();
    }

    abstract loadProject(): Promise<void>;
    abstract saveProject(): Promise<void>;
    abstract updateThumbnail(): Promise<void>;

    logEvent(event: string, data?: any) {
        console.debug(event, data);
    }

    getLastPlatform(): string {
        return localStorage.getItem('lopaka_library') || FlipperPlatform.id;
    }
}
