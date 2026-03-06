// Copy payload snapshot for each copied layer.
export type TCopyRecord = {
    constructor: any;
    state: any;
};

// Buffer payload used by Ctrl+V.
export type TCopyBuffer = {
    records: TCopyRecord[];
    fullySelectedGroups: string[];
};

type TProjectClipboardState = {
    projectId: number | null;
    buffer: TCopyBuffer | null;
};

// Keep clipboard in module scope so it survives editor/plugin reinitialization.
const projectClipboardState: TProjectClipboardState = {
    projectId: null,
    buffer: null,
};

export function syncProjectClipboard(projectId: number | null): void {
    // Preserve buffer when the same project stays active.
    if (projectClipboardState.projectId === projectId) {
        return;
    }
    // Reset buffer when project context changes.
    projectClipboardState.projectId = projectId;
    projectClipboardState.buffer = null;
}

export function getProjectClipboardBuffer(): TCopyBuffer | null {
    // Return current project-scoped clipboard payload.
    return projectClipboardState.buffer;
}

export function setProjectClipboardBuffer(buffer: TCopyBuffer | null): void {
    // Store latest copied/cut payload for active project.
    projectClipboardState.buffer = buffer;
}
