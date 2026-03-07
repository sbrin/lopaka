import {describe, expect, it, vi} from 'vitest';
import {Point} from '../core/point';
import {Editor} from './editor';

describe('Editor keyboard modifiers', () => {
    it('updates Shift state and redraws plugin overlays only when value changes', () => {
        // Create a minimal session stub required by Editor keyboard handling.
        const session = {
            state: {
                scale: new Point(1, 1),
            },
            virtualScreen: {
                redrawPlugins: vi.fn(),
            },
        };
        const editor = new Editor(session as any);
        (session as any).editor = editor;

        // Press Shift and verify state + overlay redraw.
        editor.handleEvent(new KeyboardEvent('keydown', {code: 'Shift', key: 'Shift'}));
        expect(editor.state.shiftPressed).toBe(true);
        expect(session.virtualScreen.redrawPlugins).toHaveBeenCalledTimes(1);

        // Repeat Shift keydown and verify no redundant redraw happens.
        editor.handleEvent(new KeyboardEvent('keydown', {code: 'Shift', key: 'Shift'}));
        expect(session.virtualScreen.redrawPlugins).toHaveBeenCalledTimes(1);

        // Release Shift and verify state flips back with one more redraw.
        editor.handleEvent(new KeyboardEvent('keyup', {code: 'Shift', key: 'Shift'}));
        expect(editor.state.shiftPressed).toBe(false);
        expect(session.virtualScreen.redrawPlugins).toHaveBeenCalledTimes(2);
    });
});
