import {Keys} from '../../core/keys.enum';
import {saveLayers} from '../../core/session';
import {AbstractEditorPlugin} from './abstract-editor.plugin';

export class SavePlugin extends AbstractEditorPlugin {
    onKeyDown(key: Keys, event: KeyboardEvent): void {
        if (key === Keys.KeyS && (event.ctrlKey || event.metaKey)) {
            saveLayers();
        }
    }
}
