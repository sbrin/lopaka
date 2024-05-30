import {Keys} from '../../core/keys.enum';
import {AbstractEditorPlugin} from './abstract-editor.plugin';

export class GroupPlugin extends AbstractEditorPlugin {
    onKeyDown(key: Keys, event: KeyboardEvent): void {
        const {layersManager: layerManager} = this.session;
        if (key === Keys.KeyG && (event.ctrlKey || event.metaKey)) {
            const selected = layerManager.selected;
            if (selected.length) {
                this.session.history.push({
                    type: 'group',
                    layer: null,
                    state: selected.map((l) => ({uid: l.uid, group: l.group}))
                });
                layerManager.group(selected);
                if (event.shiftKey) {
                    layerManager.ungroup(selected);
                } else {
                    layerManager.group(selected);
                }
            }
        }
    }
}
