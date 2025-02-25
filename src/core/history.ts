import {AbstractLayer} from './layers/abstract.layer';

export type TChange = {
    type: 'add' | 'remove' | 'change' | 'clear' | 'merge' | 'lock' | 'unlock';
    layer: AbstractLayer;
    state: any;
};

export type THistoryEvent = {
    type: 'undo' | 'redo' | 'clear' | 'push';
};

export type THistoryListener = (event: THistoryEvent, change: TChange) => void;

export class ChangeHistory {
    history: TChange[] = [];
    listeners: Function[] = [];
    redoHistory: TChange[] = [];
    redoStack: TChange[] = [];

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

    public undo() {
        if (this.history.length) {
            const change = this.history.pop();
            this.emit({type: 'undo'}, change);
        }
        if (this.redoHistory.length) {
            const change = this.redoHistory.pop();
            this.redoStack.push(change);
        }
    }

    public redo() {
        if (this.redoStack.length) {
            const change = this.redoStack.pop();
            this.history.push(change);
            this.redoHistory.push(change);
            this.emit({type: 'redo'}, change);
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
