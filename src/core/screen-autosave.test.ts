import {describe, expect, it, vi} from 'vitest';
import {createScreenAutosave} from './screen-autosave';

describe('createScreenAutosave', () => {
    it('runs a scheduled task with its captured screen id', () => {
        // Use fake timers to control the debounce window deterministically.
        vi.useFakeTimers();
        const run = vi.fn();
        const autosave = createScreenAutosave(1000);

        // Queue an autosave and ensure it waits for the delay.
        autosave.schedule({screenId: 7, run});
        expect(run).not.toHaveBeenCalled();
        vi.advanceTimersByTime(1000);

        // Verify the original id is passed through to the save callback.
        expect(run).toHaveBeenCalledTimes(1);
        expect(run).toHaveBeenCalledWith(7);
        vi.useRealTimers();
    });

    it('keeps the latest scheduled task and id', () => {
        // Use fake timers to assert replacement behavior.
        vi.useFakeTimers();
        const run = vi.fn();
        const autosave = createScreenAutosave(1000);

        // Queue two tasks and ensure the second one replaces the first.
        autosave.schedule({screenId: 1, run});
        autosave.schedule({screenId: 2, run});
        vi.advanceTimersByTime(1000);

        // Confirm only the newest task executes.
        expect(run).toHaveBeenCalledTimes(1);
        expect(run).toHaveBeenCalledWith(2);
        vi.useRealTimers();
    });

    it('flushes the pending task immediately', () => {
        // Use fake timers so flush can be validated before delay elapses.
        vi.useFakeTimers();
        const run = vi.fn();
        const autosave = createScreenAutosave(1000);

        // Queue a task and flush it while still inside the debounce interval.
        autosave.schedule({screenId: 13, run});
        autosave.flush();

        // Ensure flush executes once and no trailing timeout runs later.
        expect(run).toHaveBeenCalledTimes(1);
        expect(run).toHaveBeenCalledWith(13);
        vi.advanceTimersByTime(1000);
        expect(run).toHaveBeenCalledTimes(1);
        vi.useRealTimers();
    });
});
