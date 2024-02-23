import {Keys} from '../../core/keys.enum';
import {AbstractEditorPlugin} from './abstract-editor.plugin';

export class HistoryPlugin extends AbstractEditorPlugin {
    onKeyDown(key: Keys, event: KeyboardEvent): void {
        const {history, virtualScreen} = this.session;
        if (event.ctrlKey || event.metaKey) {
            if ((key === Keys.KeyZ && event.shiftKey) || key === Keys.KeyY) {
                history.redo();
                virtualScreen.redraw();
            } else if (key === Keys.KeyZ) {
                history.undo();
                virtualScreen.redraw();
            }
        }
    }
    onClear(): void {}
}
