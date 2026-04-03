import {describe, expect, it, beforeEach, vi} from 'vitest';
import {SCALE_LIST} from '/src/const';
import {Point} from './point';
import {reactive} from 'vue';

// Minimal mock of the scale-related session logic to test without full Session dependencies.
// This mirrors the exact logic from Session class.

function createScaleState() {
    const state = reactive({
        scale: new Point(4, 4),
        scaleIndex: SCALE_LIST.indexOf(400),
    });

    const setScale = (scale: number, isLogged?: boolean) => {
        state.scale = new Point(scale / 100, scale / 100);
        const idx = SCALE_LIST.indexOf(scale);
        if (idx !== -1) {
            state.scaleIndex = idx;
        }
    };

    const scaleUp = (): number => {
        const newIndex = Math.min(state.scaleIndex + 1, SCALE_LIST.length - 1);
        setScale(SCALE_LIST[newIndex], true);
        return SCALE_LIST[newIndex];
    };

    const scaleDown = (): number => {
        const newIndex = Math.max(state.scaleIndex - 1, 0);
        setScale(SCALE_LIST[newIndex], true);
        return SCALE_LIST[newIndex];
    };

    const getScalePercent = (): number => {
        return SCALE_LIST[state.scaleIndex];
    };

    return {state, setScale, scaleUp, scaleDown, getScalePercent};
}

const SCALE_MIN = SCALE_LIST[0];
const SCALE_MAX = SCALE_LIST[SCALE_LIST.length - 1];

describe('SCALE_LIST', () => {
    it('should have at least 3 zoom levels', () => {
        expect(SCALE_LIST.length).toBeGreaterThanOrEqual(3);
    });

    it('should contain 100% as a zoom level', () => {
        expect(SCALE_LIST).toContain(100);
    });

    it('should be sorted in ascending order', () => {
        for (let i = 1; i < SCALE_LIST.length; i++) {
            expect(SCALE_LIST[i]).toBeGreaterThan(SCALE_LIST[i - 1]);
        }
    });
});

describe('Session scale methods', () => {
    let s: ReturnType<typeof createScaleState>;

    beforeEach(() => {
        s = createScaleState();
    });

    describe('setScale', () => {
        it('should set scale Point from percentage', () => {
            s.setScale(200);
            expect(s.state.scale.x).toBe(2);
            expect(s.state.scale.y).toBe(2);
        });

        it('should sync scaleIndex when value is in SCALE_LIST', () => {
            s.setScale(100);
            expect(s.state.scaleIndex).toBe(SCALE_LIST.indexOf(100));
        });

        it('should not change scaleIndex when value is not in SCALE_LIST', () => {
            const oldIndex = s.state.scaleIndex;
            s.setScale(175); // not in list
            expect(s.state.scaleIndex).toBe(oldIndex);
            // But scale Point should still be set
            expect(s.state.scale.x).toBe(1.75);
        });

        it('should handle minimum scale', () => {
            s.setScale(25);
            expect(s.state.scale.x).toBe(0.25);
            expect(s.state.scaleIndex).toBe(0);
        });

        it('should handle maximum scale', () => {
            s.setScale(SCALE_MAX);
            expect(s.state.scale.x).toBe(SCALE_MAX / 100);
            expect(s.state.scaleIndex).toBe(SCALE_LIST.length - 1);
        });
    });

    describe('scaleUp', () => {
        it('should increment to next scale level', () => {
            s.setScale(100); // index 2
            const result = s.scaleUp();
            expect(result).toBe(150);
            expect(s.state.scaleIndex).toBe(3);
            expect(s.state.scale.x).toBe(1.5);
        });

        it('should clamp at maximum scale', () => {
            s.setScale(SCALE_MAX); // last index
            const result = s.scaleUp();
            expect(result).toBe(SCALE_MAX);
            expect(s.state.scaleIndex).toBe(SCALE_LIST.length - 1);
        });

        it('should return the new scale percentage', () => {
            s.setScale(400); // index 6
            expect(s.scaleUp()).toBe(600);
            expect(s.scaleUp()).toBe(800);
            expect(s.scaleUp()).toBe(1000);
        });
    });

    describe('scaleDown', () => {
        it('should decrement to previous scale level', () => {
            s.setScale(400); // index 6
            const result = s.scaleDown();
            expect(result).toBe(300);
            expect(s.state.scaleIndex).toBe(5);
            expect(s.state.scale.x).toBe(3);
        });

        it('should clamp at minimum scale', () => {
            s.setScale(25); // index 0
            const result = s.scaleDown();
            expect(result).toBe(25);
            expect(s.state.scaleIndex).toBe(0);
        });

        it('should return the new scale percentage', () => {
            s.setScale(400); // index 6
            expect(s.scaleDown()).toBe(300);
            expect(s.scaleDown()).toBe(200);
            expect(s.scaleDown()).toBe(150);
        });
    });

    describe('getScalePercent', () => {
        it('should return current scale as percentage', () => {
            s.setScale(400);
            expect(s.getScalePercent()).toBe(400);
        });

        it('should reflect changes from scaleUp', () => {
            s.setScale(100);
            s.scaleUp();
            expect(s.getScalePercent()).toBe(150);
        });

        it('should reflect changes from scaleDown', () => {
            s.setScale(400);
            s.scaleDown();
            expect(s.getScalePercent()).toBe(300);
        });
    });

    describe('scaleUp and scaleDown round-trip', () => {
        it('should return to original after up then down', () => {
            s.setScale(400);
            s.scaleUp();
            s.scaleDown();
            expect(s.getScalePercent()).toBe(400);
        });

        it('should walk through all levels and back', () => {
            s.setScale(SCALE_MIN);
            const visited: number[] = [s.getScalePercent()];
            for (let i = 0; i < SCALE_LIST.length + 2; i++) {
                s.scaleUp();
                visited.push(s.getScalePercent());
            }
            // Should reach max and stay there
            expect(visited[visited.length - 1]).toBe(SCALE_MAX);

            for (let i = 0; i < SCALE_LIST.length + 2; i++) {
                s.scaleDown();
            }
            expect(s.getScalePercent()).toBe(SCALE_MIN);
        });
    });
});
