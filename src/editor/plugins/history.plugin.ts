import {Keys} from '../../core/keys.enum';
import {AbstractEditorPlugin} from './abstract-editor.plugin';

export class HistoryPlugin extends AbstractEditorPlugin {
    onKeyDown(key: Keys, event: KeyboardEvent): void {
        const {history} = this.session;
        if ((event.ctrlKey || event.metaKey) && key === Keys.KeyZ && !event.shiftKey) {
            history.undo();
        }
    }
}
