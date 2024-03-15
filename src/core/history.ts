import {AbstractLayer} from './layers/abstract.layer';

export type TChange = {
    type: 'add' | 'remove' | 'change' | 'clear' | 'merge';
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

    constructor() {}

    public clear() {
        this.history.splice(0, this.history.length);
        this.emit({type: 'clear'}, null);
    }

    public push(change: TChange) {
        change.state = change.state;
        this.history.push(change);
        this.emit({type: 'push'}, change);
    }

    public undo() {
        if (this.history.length) {
            const change = this.history.pop();
            this.emit({type: 'undo'}, change);
        }
    }

    // public redo() {
    //     if (this.head < this.history.length) {
    //         this.head++;
    //         const lastChange = this.lastChange();
    //         if (lastChange) {
    //             this.emit({type: 'redo'}, this.history[this.head]);
    //         }
    //     }
    // }

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
