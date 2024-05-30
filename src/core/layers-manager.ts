import {loadFont} from '../draw/fonts';
import {debounce, postParentMessage} from '../utils';
import {TChange, THistoryEvent} from './history';
import {AbstractImageLayer} from './layers/abstract-image.layer';
import {AbstractLayer} from './layers/abstract.layer';
import {CircleLayer} from './layers/circle.layer';
import {DotLayer} from './layers/dot.layer';
import {EllipseLayer} from './layers/ellipse.layer';
import {IconLayer} from './layers/icon.layer';
import {LineLayer} from './layers/line.layer';
import {PaintLayer} from './layers/paint.layer';
import {RectangleLayer} from './layers/rectangle.layer';
import {TextLayer} from './layers/text.layer';
import {Point} from './point';
import {Rect} from './rect';
import {Session} from './session';

export class LayersManager {
    // groups: Map<string, AbstractLayer[]> = new Map();

    groupCounter = 0;

    groupsMap: Map<string, string[]> = new Map();
    layersMap: Map<string, AbstractLayer> = new Map();

    LayerClassMap: {[key in ELayerType]: any} = {
        box: RectangleLayer,
        frame: RectangleLayer,
        rect: RectangleLayer,
        circle: CircleLayer,
        disc: CircleLayer,
        dot: DotLayer,
        icon: IconLayer,
        line: LineLayer,
        string: TextLayer,
        paint: PaintLayer,
        ellipse: EllipseLayer
    };

    get layers() {
        return Array.from(this.layersMap.values());
    }

    get selected(): AbstractLayer[] {
        return this.layers.filter((l) => l.selected);
    }

    get sorted(): AbstractLayer[] {
        return this.layers.sort((a, b) => a.index - b.index);
    }

    get count() {
        return this.layersMap.size;
    }

    constructor(private session: Session) {}

    getLayer(uid: string): AbstractLayer {
        return this.layersMap.get(uid);
    }

    getLayersInGroup(group: string): AbstractLayer[] {
        return this.groupsMap.get(group).map((uid) => this.getLayer(uid));
    }

    getGroupBounds(group: string): Rect {
        const layers = this.getLayersInGroup(group);
        return layers.reduce((acc, l) => acc.extends(l.bounds), new Rect(layers[0].bounds));
    }

    eachLayer(callback: (layer: AbstractLayer) => void) {
        this.layersMap.forEach(callback);
        this.requestUpdate();
    }

    contains(point: Point) {
        return this.sorted.filter((l) => l.contains(point));
    }

    update() {
        // this.session.state.layers = Array.from(this.layersMap.values());
        // emit update? FIXME!
        this.session.state.updates++;
        console.log('layers updated');
        this.saveLayers();
    }

    selectLayer(layer: AbstractLayer) {
        layer.selected = true;
        this.session.state.selectionUpdates++;
    }

    unselectLayer(layer: AbstractLayer) {
        layer.selected = false;
        this.session.state.selectionUpdates++;
    }

    clearSelection() {
        this.eachLayer((l) => (l.selected = false));
        this.session.state.selectionUpdates++;
    }

    debouncedUpdate = debounce(() => {
        this.update();
    }, 100);

    requestUpdate() {
        this.debouncedUpdate();
        this.session.state.immidiateUpdates++;
    }

    add(layer: AbstractLayer) {
        const {display, scale} = this.session.state;
        layer.resize(display, scale);
        layer.index = layer.index ?? this.layersMap.size + 1;
        layer.name = layer.name ?? 'Layer ' + (this.layersMap.size + 1);
        this.layersMap.set(layer.uid, layer);
        layer.draw();
        if (layer.group) {
            if (!this.groupsMap.has(layer.group)) {
                this.groupsMap.set(layer.group, []);
            }
            this.groupsMap.get(layer.group).push(layer.uid);
        }
        this.requestUpdate();
    }

    group(layers: AbstractLayer[]) {
        const groupName = `Group ${++this.groupCounter}`;
        layers
            .sort((a, b) => a.index - b.index)
            .forEach((l: AbstractLayer) => {
                l.group = groupName;
            });
        let groupInserted = false;
        let index = 1;
        this.sorted.forEach((l) => {
            if (l.group === groupName) {
                groupInserted = true;
                layers.forEach((layer) => {
                    layer.index = index++;
                });
            } else {
                l.index = index++;
            }
        });
        this.groupsMap.set(
            groupName,
            layers.map((l) => l.uid)
        );
        this.requestUpdate();
    }

    ungroup(layers: AbstractLayer[]) {
        layers.forEach((l: AbstractLayer) => {
            l.group = null;
        });
    }

    mergeLayers(layers: AbstractLayer[]): AbstractImageLayer {
        const layer = new PaintLayer(this.session.getPlatformFeatures());
        this.add(layer);
        const ctx = layer.getBuffer().getContext('2d');
        layers.forEach((l) => {
            l.selected = false;
            if (l.inverted) {
                ctx.globalCompositeOperation = 'difference';
            }
            ctx.drawImage(l.getBuffer(), 0, 0);
            ctx.globalCompositeOperation = 'source-over';
            this.removeLayer(l);
        });
        layer.recalculate();
        layer.applyColor();
        layer.stopEdit();
        layer.selected = true;
        layer.draw();
        return layer;
    }

    removeLayer(layer: AbstractLayer) {
        this.layersMap.delete(layer.uid);
        if (layer.group) {
            this.groupsMap.get(layer.group)?.splice(this.groupsMap.get(layer.group).indexOf(layer.uid), 1);
        }
        this.requestUpdate();
        // this.session.state.layers = this.session.state.layers.filter((l) => l.uid !== layer.uid);
    }

    clearLayers() {
        this.layersMap.clear();
        this.requestUpdate();
    }

    async loadFontsForLayers(usedFonts: string[]) {
        const fonts = this.session.platforms[this.session.state.platform].getFonts();
        if (!usedFonts.includes(fonts[0].name)) {
            usedFonts.push(fonts[0].name);
        }
        return Promise.all(fonts.filter((font) => usedFonts.includes(font.name)).map((font) => loadFont(font)));
    }

    async loadLayers(states: any[]) {
        this.clearLayers();
        const platformFeatures = this.session.getPlatformFeatures();
        return this.loadFontsForLayers(states.filter((s) => s.t == 'string').map((s) => s.f)).then(() => {
            states.forEach((state) => {
                const layerClass = this.LayerClassMap[state.t];
                const layer = new layerClass(platformFeatures);
                layer.state = state;
                this.add(layer);
            });
        });
    }

    saveLayers() {
        const packedSession = JSON.stringify(this.layers.map((l) => l.state));
        if (window.top !== window.self) {
            postParentMessage('updateLayers', packedSession);
            postParentMessage('updateThumbnail', this.session.virtualScreen.canvas.toDataURL());
        } else {
            localStorage.setItem(`${this.session.state.platform}_lopaka_layers`, packedSession);
        }
    }

    undoChange(event: THistoryEvent, change: TChange) {
        switch (event.type) {
            case 'undo':
                switch (change.type) {
                    case 'add':
                        this.removeLayer(change.layer);
                        break;
                    case 'remove':
                        this.add(change.layer);
                        break;
                    case 'change':
                        change.layer.state = change.state;
                        change.layer.draw();
                        break;
                    case 'merge':
                        this.removeLayer(change.layer);
                        change.state.forEach((l) => {
                            this.add(l);
                        });
                        break;
                    case 'group':
                        this.eachLayer((l) => {
                            const groupChange = change.state.find((c) => c.uid == l.uid);
                            if (groupChange) {
                                l.group = groupChange.group;
                            }
                        });
                    case 'clear':
                        change.state.forEach((l) => {
                            const type: ELayerType = l.t;
                            if (type in this.LayerClassMap) {
                                const layer = new this.LayerClassMap[type](this.session.getPlatformFeatures());
                                layer.loadState(l);
                                this.add(layer);
                                layer.saveState();
                            }
                        });
                        break;
                }
                break;
        }
    }
}
