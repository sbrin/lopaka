import {describe, expect, it} from 'vitest';
import {shouldScheduleFuiEditorAutosave} from '/src/components/fui/FuiEditorAutosave';

describe('shouldScheduleFuiEditorAutosave', () => {
    it('returns false for bootstrap updates', () => {
        // Ensure initial reactive setup updates never schedule autosave writes.
        expect(
            shouldScheduleFuiEditorAutosave({
                oldImmediateUpdates: 1,
                screenId: 10,
                isScreenLoaded: true,
                readonly: false,
            })
        ).toBe(false);
    });

    it('returns false when screen id is missing', () => {
        // Prevent autosave when the current context has no persisted screen record.
        expect(
            shouldScheduleFuiEditorAutosave({
                oldImmediateUpdates: 5,
                screenId: undefined,
                isScreenLoaded: true,
                readonly: false,
            })
        ).toBe(false);
    });

    it('returns false while screen data is loading', () => {
        // Guard against saving transient empty layers during load transitions.
        expect(
            shouldScheduleFuiEditorAutosave({
                oldImmediateUpdates: 5,
                screenId: 10,
                isScreenLoaded: false,
                readonly: false,
            })
        ).toBe(false);
    });

    it('returns false for readonly screens', () => {
        // Keep gallery and other readonly routes from issuing update requests.
        expect(
            shouldScheduleFuiEditorAutosave({
                oldImmediateUpdates: 5,
                screenId: 10,
                isScreenLoaded: true,
                readonly: true,
            })
        ).toBe(false);
    });

    it('returns true for editable loaded screens', () => {
        // Confirm autosave is still enabled for normal editor interactions.
        expect(
            shouldScheduleFuiEditorAutosave({
                oldImmediateUpdates: 5,
                screenId: 10,
                isScreenLoaded: true,
                readonly: false,
            })
        ).toBe(true);
    });
});
