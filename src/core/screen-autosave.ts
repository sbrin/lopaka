export type ScreenAutosaveTask = {
    screenId: number;
    run: (screenId: number) => void;
};

export type ScreenAutosaveController = {
    schedule: (task: ScreenAutosaveTask) => void;
    flush: () => void;
    cancel: () => void;
};

export function createScreenAutosave(delay = 1000): ScreenAutosaveController {
    // Keep the currently scheduled timeout so new edits can replace it.
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    // Track the pending task and its captured screen id.
    let pendingTask: ScreenAutosaveTask | null = null;

    // Execute and clear the pending task using its original screen id.
    const runPendingTask = () => {
        if (!pendingTask) {
            return;
        }
        const task = pendingTask;
        pendingTask = null;
        timeoutId = null;
        task.run(task.screenId);
    };

    // Schedule a debounced autosave for the provided task.
    const schedule = (task: ScreenAutosaveTask) => {
        pendingTask = task;
        if (timeoutId) {
            clearTimeout(timeoutId);
        }
        timeoutId = setTimeout(runPendingTask, delay);
    };

    // Immediately run the pending task, if any, before context switches.
    const flush = () => {
        if (timeoutId) {
            clearTimeout(timeoutId);
        }
        runPendingTask();
    };

    // Clear all pending autosave state without executing it.
    const cancel = () => {
        if (timeoutId) {
            clearTimeout(timeoutId);
        }
        timeoutId = null;
        pendingTask = null;
    };

    return {schedule, flush, cancel};
}
