import {Keys} from '../../core/keys.enum';
import {generateUID} from '../../utils';
import {AbstractEditorPlugin} from './abstract-editor.plugin';

export class GroupPlugin extends AbstractEditorPlugin {
    onKeyDown(key: Keys, event: KeyboardEvent): void {
        const {layers} = this.session.state;
        if (key === Keys.KeyG && (event.ctrlKey || event.metaKey)) {
            const selected = layers.filter((layer) => layer.selected);
            if (selected.length) {
                this.session.history.push({
                    type: 'group',
                    layer: null,
                    state: selected.map((l) => ({uid: l.uid, group: l.group}))
                });
                if (event.shiftKey) {
                    // remove groups
                    selected.forEach((layer) => {
                        layer.group = null;
                    });
                } else {
                    // create group
                    const group = generateUID();
                    selected.forEach((layer) => {
                        layer.group = group;
                    });
                }
            }
        }
    }
}
