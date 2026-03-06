import {AbstractLayer} from './layers/abstract.layer';

export type TChangeType =
    | 'add'
    | 'remove'
    | 'change'
    | 'clear'
    | 'merge'
    | 'lock'
    | 'unlock'
    | 'show'
    | 'hide'
    | 'group'
    | 'begin'
    | 'end';

export type TChange = {
    type: TChangeType;
    layer?: AbstractLayer;
    state?: any;
};

export type THistoryEvent = {
    type: 'undo' | 'redo' | 'clear' | 'push';
};

export type THistoryListener = (event: THistoryEvent, change: TChange) => void;

// Keeps paired undo/redo states for a single change
type TRedoPair = {
    undo: TChange;
    redo: TChange;
};

// Wraps a batch of redo pairs so grouped actions stay together
type TRedoBatch = {
    isBatch: boolean;
    changes: TRedoPair[];
};

export class ChangeHistory {
    history: TChange[] = [];
    listeners: Function[] = [];
    redoHistory: TChange[] = [];
    redoStack: TRedoBatch[] = [];

    constructor() {}

    public clear(emit: boolean = true) {
        this.history.splice(0, this.history.length);
        if (emit) {
            this.emit({type: 'clear'}, null);
        }
    }

    public push(change: TChange) {
        this.history.push(change);
        this.emit({type: 'push'}, change);
    }
    // TODO: Refactor this Dumb way to keep the actual layer state
    // Mabe use the pointer index to navigate through history
    public pushRedo(change: TChange) {
        this.redoHistory.push(change);
        this.redoStack = [];
    }

    public batchStart() {
        this.push({type: 'end'});
    }

    public batchEnd() {
        this.push({type: 'begin'});
    }

    public undo() {
        // Exit early when nothing can be undone
        if (!this.history.length) {
            return;
        }
        // Accumulate undo/redo pairs for the action being undone
        const batch: TRedoPair[] = [];
        let isBatch = false;
        let change = this.history.pop();
        if (!change) {
            return;
        }
        if (change.type === 'begin') {
            isBatch = true;
            while (this.history.length) {
                const next = this.history.pop();
                if (!next) {
                    break;
                }
                if (next.type === 'end') {
                    break;
                }
                this.emit({type: 'undo'}, next);
                const redoState = this.redoHistory.pop();
                if (redoState) {
                    batch.push({undo: next, redo: redoState});
                }
            }
        } else {
            this.emit({type: 'undo'}, change);
            const redoState = this.redoHistory.pop();
            if (redoState) {
                batch.push({undo: change, redo: redoState});
            }
        }
        if (batch.length) {
            this.redoStack.push({
                isBatch: isBatch || batch.length > 1,
                changes: batch,
            });
        }
    }

    public redo() {
        // Exit early when redo history is empty
        if (!this.redoStack.length) {
            return;
        }
        // Restore the last undone batch as a single redo action
        const batch = this.redoStack.pop();
        if (!batch || !batch.changes.length) {
            return;
        }
        if (batch.isBatch) {
            this.history.push({type: 'end'});
        }
        for (let i = batch.changes.length - 1; i >= 0; i--) {
            const entry = batch.changes[i];
            this.history.push(entry.undo);
            this.redoHistory.push(entry.redo);
            this.emit({type: 'redo'}, entry.redo);
        }
        if (batch.isBatch) {
            this.history.push({type: 'begin'});
        }
    }

    private emit(event: THistoryEvent, change: TChange) {
        this.listeners.forEach((l) => l(event, change));
    }

    public subscribe(listener: THistoryListener) {
        this.listeners.push(listener);
    }

    public unsubscribe(listener: THistoryListener) {
        this.listeners = this.listeners.filter((l) => l !== listener);
    }
}

const history = new ChangeHistory();

export function useHistory() {
    return history;
}
