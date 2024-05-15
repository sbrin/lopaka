import {Keys} from '../../core/keys.enum';
import {AbstractEditorPlugin} from './abstract-editor.plugin';

export class DeletePlugin extends AbstractEditorPlugin {
    onKeyDown(key: Keys, event: KeyboardEvent): void {
        const {layersManager} = this.session;
        if (key === Keys.Delete || key === Keys.Backspace) {
            const selected = layersManager.selected;
            if (selected.length) {
                selected.forEach((l) => this.session.removeLayer(l));
            }
        }
        this.session.virtualScreen.redraw();
    }
}
