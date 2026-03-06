export type FuiEditorAutosaveGate = {
    oldImmediateUpdates: number;
    screenId?: number | null;
    isScreenLoaded: boolean;
    readonly: boolean;
};

export function shouldScheduleFuiEditorAutosave(gate: FuiEditorAutosaveGate): boolean {
    // Ignore bootstrap updates that happen before the editor is interactive.
    if (gate.oldImmediateUpdates <= 1) {
        return false;
    }
    // Skip autosave when there is no persisted server screen id.
    if (!gate.screenId) {
        return false;
    }
    // Avoid saving transient empty layer state while a screen is loading.
    if (!gate.isScreenLoaded) {
        return false;
    }
    // Prevent writes from read-only contexts such as gallery viewer routes.
    if (gate.readonly) {
        return false;
    }
    // Allow autosave only when all safety checks are satisfied.
    return true;
}
