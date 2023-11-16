import {Keys} from '../../core/keys.enum';
import {AbstractLayer} from '../../core/layers/abstract.layer';
import {AbstractEditorPlugin} from './abstract-editor.plugin';

type TCopyRecord = {
    constructor: any;
    state: any;
};

export class CopyPlugin extends AbstractEditorPlugin {
    buffer: TCopyRecord[];
    onKeyDown(key: Keys, event: KeyboardEvent): void {
        const {layers} = this.session.state;
        if (key === Keys.KeyC && (event.ctrlKey || event.metaKey)) {
            const selected = layers.filter((layer) => layer.selected);
            if (selected.length) {
                this.buffer = selected.map((layer) => ({constructor: layer.constructor, state: layer.getState()}));
            }
        } else if (key === Keys.KeyV && (event.ctrlKey || event.metaKey)) {
            if (this.buffer) {
                layers.forEach((layer) => (layer.selected = false));
                this.buffer.forEach((record) => {
                    const l: AbstractLayer = new record.constructor(this.session.getPlatformFeatures());
                    const uid = l.uid;
                    l.loadState(record.state);
                    l.uid = uid;
                    if (l.modifiers.x && l.modifiers.y) {
                        l.modifiers.x.setValue(l.modifiers.x.getValue() + 2);
                        l.modifiers.y.setValue(l.modifiers.y.getValue() + 2);
                    } else if (l.modifiers.x1 && l.modifiers.y1 && l.modifiers.x2 && l.modifiers.y2) {
                        l.modifiers.x1.setValue(l.modifiers.x1.getValue() + 2);
                        l.modifiers.y1.setValue(l.modifiers.y1.getValue() + 2);
                        l.modifiers.x2.setValue(l.modifiers.x2.getValue() + 2);
                        l.modifiers.y2.setValue(l.modifiers.y2.getValue() + 2);
                    }
                    l.index = layers.length;
                    l.name = 'Layer ' + (layers.length + 1);
                    l.selected = true;
                    l.stopEdit();
                    this.session.addLayer(l);
                });
                this.session.virtualScreen.redraw();
            }
        }
    }
}
