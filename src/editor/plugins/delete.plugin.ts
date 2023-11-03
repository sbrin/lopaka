import {Keys} from '../../core/keys.enum';
import {EditorPlugin} from './editor.plugin';

export class DeletePlugin extends EditorPlugin {
    onKeyDown(key: Keys, event: KeyboardEvent): void {
        const {layers} = this.session.state;
        if (key === Keys.Delete || key === Keys.Backspace) {
            const selected = layers.filter((layer) => layer.selected);
            if (selected.length) {
                selected.forEach((l) => this.session.removeLayer(l));
            }
        }
    }
}
