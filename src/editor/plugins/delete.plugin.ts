import {Keys} from '../../core/keys.enum';
import {AbstractEditorPlugin} from './abstract-editor.plugin';

export class DeletePlugin extends AbstractEditorPlugin {
    onKeyDown(key: Keys, event: KeyboardEvent): void {
        const {layersManager} = this.session;
        if (key === Keys.Delete || key === Keys.Backspace) {
            const selected = layersManager.selected;
            if (selected.length) {
                // Funnel deletions through the layers manager so undo groups them
                this.session.layersManager.removeLayers(selected);
            }
        }
    }
}
