import {AbstractLayer} from './layers/abstract.layer';

export type TChange = {
    type: 'add' | 'remove' | 'change';
    layer: AbstractLayer;
    state: any;
};

export type THistoryEvent = {
    type: 'undo' | 'redo' | 'clear' | 'push';
};

export type THistoryListener = (event: THistoryEvent, change: TChange) => void;

export class ChangeHistory {
    history: TChange[] = [];
    head: number = 0;
    listeners: Function[] = [];

    constructor() {}

    public clear() {
        // this.history.splice(0, this.history.length);
        // this.head = 0;
        // this.emit({type: 'clear'}, null);
    }

    public push(change: TChange) {
        // this.history.push(change);
        // this.head = this.history.length - 1;
        // this.emit({type: 'push'}, change);
    }

    public lastChange() {
        return this.history.length ? this.history[this.head] : null;
    }

    public undo() {
        const lastChange = this.lastChange();
        if (lastChange) {
            this.emit({type: 'undo'}, this.history[this.head]);
            if (this.head > 0) {
                this.head--;
            }
        }
    }

    public redo() {
        if (this.head < this.history.length) {
            this.head++;
            const lastChange = this.lastChange();
            if (lastChange) {
                this.emit({type: 'redo'}, this.history[this.head]);
            }
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
