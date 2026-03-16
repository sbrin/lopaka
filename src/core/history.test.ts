import {describe, expect, it, vi, beforeEach} from 'vitest';
import {ChangeHistory, useHistory, TChange, THistoryEvent} from './history';

// Mock AbstractLayer since it's a complex dependency
const mockLayer = {
    uid: 'test-layer-1',
    type: 'rectangle',
    bounds: {x: 0, y: 0, w: 10, h: 10},
};

describe('ChangeHistory', () => {
    let history: ChangeHistory;

    beforeEach(() => {
        history = new ChangeHistory();
    });

    describe('constructor', () => {
        it('should initialize empty history', () => {
            expect(history.history).toEqual([]);
            expect(history.listeners).toEqual([]);
            expect(history.redoHistory).toEqual([]);
            expect(history.redoStack).toEqual([]);
        });
    });

    describe('push', () => {
        it('should add change to history', () => {
            const change: TChange = {
                type: 'add',
                layer: mockLayer as any,
                state: {x: 10, y: 20},
            };

            const listener = vi.fn();
            history.subscribe(listener);

            history.push(change);

            expect(history.history).toHaveLength(1);
            expect(history.history[0]).toBe(change);
            expect(listener).toHaveBeenCalledWith({type: 'push'}, change);
        });

        it('should emit push event to all listeners', () => {
            const listener1 = vi.fn();
            const listener2 = vi.fn();
            const change: TChange = {
                type: 'change',
                layer: mockLayer as any,
                state: {x: 15},
            };

            history.subscribe(listener1);
            history.subscribe(listener2);
            history.push(change);

            expect(listener1).toHaveBeenCalledWith({type: 'push'}, change);
            expect(listener2).toHaveBeenCalledWith({type: 'push'}, change);
        });
    });

    describe('clear', () => {
        it('should clear history and emit event', () => {
            const change: TChange = {
                type: 'add',
                layer: mockLayer as any,
                state: {},
            };

            history.push(change);
            expect(history.history).toHaveLength(1);

            const listener = vi.fn();
            history.subscribe(listener);

            history.clear();

            expect(history.history).toHaveLength(0);
            expect(listener).toHaveBeenCalledWith({type: 'clear'}, null);
        });

        it('should not emit event when emit is false', () => {
            const listener = vi.fn();
            history.subscribe(listener);

            history.clear(false);

            expect(listener).not.toHaveBeenCalled();
        });
    });

    describe('undo', () => {
        it('should undo last change, move change from redoHistory to redoStack, and emit event', () => {
            const initialLayerState = {x: 5};
            const change1: TChange = {
                type: 'add',
                layer: mockLayer as any,
                state: {x: 10},
            };
            const change2: TChange = {
                type: 'change',
                layer: mockLayer as any,
                state: {x: 20},
            };

            // Simulate history
            history.push(change1);
            history.pushRedo({...change1, state: initialLayerState}); // state before change
            history.push(change2);
            history.pushRedo(change1); // state before change 2 was state of change 1

            expect(history.history).toHaveLength(2);
            expect(history.redoHistory).toHaveLength(2);

            const listener = vi.fn();
            history.subscribe(listener);

            history.undo();

            // After undo, history has one less item
            expect(history.history).toHaveLength(1);
            // The undone change (from history) is emitted
            expect(listener).toHaveBeenCalledWith({type: 'undo'}, change2);
            // The state from redoHistory is moved to redoStack
            expect(history.redoStack).toHaveLength(1);
            expect(history.redoStack[0].changes).toHaveLength(1);
            expect(history.redoStack[0].changes[0].undo).toEqual(change2);
            expect(history.redoStack[0].changes[0].redo).toEqual(change1);
            expect(history.redoHistory).toHaveLength(1);
        });

        it('should handle undo when history is empty', () => {
            const listener = vi.fn();
            history.subscribe(listener);

            history.undo();

            expect(history.history).toHaveLength(0);
            expect(listener).not.toHaveBeenCalled();
        });

        it('should lose the undone change if redoHistory is empty', () => {
            const change1: TChange = {
                type: 'add',
                layer: mockLayer as any,
                state: {x: 10},
            };
            history.push(change1);
            expect(history.history).toHaveLength(1);
            expect(history.redoHistory).toHaveLength(0); // redoHistory is empty

            history.undo();

            expect(history.history).toHaveLength(0);
            // Nothing is pushed to redoStack
            expect(history.redoStack).toHaveLength(0);

            // The change is lost, redo is not possible.
            history.redo();
            expect(history.history).toHaveLength(0);
        });
    });

    describe('redo', () => {
        it('should redo the last undone change from the redoStack', () => {
            const change1: TChange = {
                type: 'add',
                layer: mockLayer as any,
                state: {x: 10},
            };
            const change2: TChange = {
                type: 'change',
                layer: mockLayer as any,
                state: {x: 20},
            };

            // Setup: push two changes
            history.push(change1);
            history.pushRedo(change1);
            history.push(change2);
            history.pushRedo(change2);

            // Step 1: Undo the last change
            history.undo();
            expect(history.history).toHaveLength(1);
            expect(history.redoStack).toHaveLength(1);
            expect(history.redoStack[0].changes).toHaveLength(1);
            expect(history.redoStack[0].changes[0].undo).toBe(change2);
            expect(history.redoStack[0].changes[0].redo).toBe(change2);

            const listener = vi.fn();
            history.subscribe(listener);

            // Step 2: Redo the change
            history.redo();

            // Assertions for redo
            expect(history.history).toHaveLength(2);
            expect(history.redoStack).toHaveLength(0);
            expect(history.redoHistory).toHaveLength(2);
            expect(history.history[1]).toBe(change2);
            expect(listener).toHaveBeenCalledWith({type: 'redo'}, change2);

            // Step 3: Redo again when stack is empty
            listener.mockClear();
            history.redo();
            expect(listener).not.toHaveBeenCalled();
        });

        it('should redo all changes in a batch with a single call', () => {
            // Clone mock layers to ensure unique identifiers per change
            const layerA = {...mockLayer, uid: 'layer-a'};
            const layerB = {...mockLayer, uid: 'layer-b'};
            const undoA: TChange = {
                type: 'change',
                layer: layerA as any,
                state: {x: 1},
            };
            const undoB: TChange = {
                type: 'change',
                layer: layerB as any,
                state: {x: 2},
            };
            const redoA: TChange = {
                type: 'change',
                layer: layerA as any,
                state: {x: 11},
            };
            const redoB: TChange = {
                type: 'change',
                layer: layerB as any,
                state: {x: 22},
            };

            // Record batched history entries and corresponding redo states
            history.batchStart();
            history.push(undoA);
            history.push(undoB);
            history.pushRedo(redoA);
            history.pushRedo(redoB);
            history.batchEnd();

            // Undo once so we capture both changes inside a single batch
            history.undo();

            expect(history.redoStack).toHaveLength(1);
            expect(history.redoStack[0].isBatch).toBe(true);
            expect(history.redoStack[0].changes).toHaveLength(2);

            // Watch redo events to verify they dispatch for every layer
            const listener = vi.fn();
            history.subscribe(listener);

            // Redo should restore both layers with one invocation
            history.redo();

            expect(listener).toHaveBeenCalledTimes(2);
            expect(listener.mock.calls[0]).toEqual([{type: 'redo'}, redoA]);
            expect(listener.mock.calls[1]).toEqual([{type: 'redo'}, redoB]);
            expect(history.redoStack).toHaveLength(0);
            expect(history.history.slice(-4)).toEqual([{type: 'end'}, undoA, undoB, {type: 'begin'}]);
        });
    });

    describe('pushRedo', () => {
        it('should add change to redo history and clear redo stack', () => {
            const change: TChange = {
                type: 'change',
                layer: mockLayer as any,
                state: {x: 35},
            };

            // Add something to redo stack first
            history.redoStack.push({
                isBatch: false,
                changes: [
                    {
                        undo: {
                            type: 'add',
                            layer: mockLayer as any,
                            state: {},
                        },
                        redo: {
                            type: 'add',
                            layer: mockLayer as any,
                            state: {},
                        },
                    },
                ],
            });

            history.pushRedo(change);

            expect(history.redoHistory).toHaveLength(1);
            expect(history.redoHistory[0]).toBe(change);
            expect(history.redoStack).toHaveLength(0);
        });
    });

    describe('event subscription', () => {
        it('should subscribe and unsubscribe listeners', () => {
            const listener1 = vi.fn();
            const listener2 = vi.fn();

            history.subscribe(listener1);
            history.subscribe(listener2);
            expect(history.listeners).toHaveLength(2);

            history.unsubscribe(listener1);
            expect(history.listeners).toHaveLength(1);
            expect(history.listeners[0]).toBe(listener2);
        });

        it('should not fail when unsubscribing non-existent listener', () => {
            const listener = vi.fn();

            expect(() => history.unsubscribe(listener)).not.toThrow();
        });
    });

    describe('change types', () => {
        it('should handle all change types', () => {
            const changeTypes: TChange['type'][] = [
                'add',
                'remove',
                'change',
                'clear',
                'merge',
                'lock',
                'unlock',
                'show',
                'hide',
            ];

            changeTypes.forEach((type) => {
                const change: TChange = {
                    type,
                    layer: mockLayer as any,
                    state: {},
                };

                expect(() => history.push(change)).not.toThrow();
            });
        });
    });
});

describe('useHistory', () => {
    it('should return the same history instance', () => {
        const history1 = useHistory();
        const history2 = useHistory();

        expect(history1).toBe(history2);
        expect(history1).toBeInstanceOf(ChangeHistory);
    });

    it('should maintain state across calls', () => {
        const history1 = useHistory();
        const change: TChange = {
            type: 'add',
            layer: mockLayer as any,
            state: {},
        };

        history1.push(change);

        const history2 = useHistory();
        expect(history2.history).toHaveLength(1);
    });
});
