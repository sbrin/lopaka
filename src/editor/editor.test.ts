import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {Point} from '../core/point';
import {Editor} from './editor';

describe('Editor.getViewportCenterInCanvas', () => {
    beforeEach(() => {
        vi.stubGlobal('DOMMatrix', function (this: any, transform?: string) {
            this.m41 = 0;
            this.m42 = 0;
            this.scale = vi.fn(() => this);
            this.translate = vi.fn(() => this);
            if (transform) {
                const m = /translate\(([^,]+),\s*([^)]+)\)/.exec(transform);
                if (m) {
                    this.m41 = parseFloat(m[1].replace('px', ''));
                    this.m42 = parseFloat(m[2].replace('px', ''));
                }
            }
        } as any);
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('returns display center when scrollContainer is null', () => {
        const session = {
            state: {
                display: new Point(128, 64),
                scale: new Point(1, 1),
            },
        };
        const editor = new Editor(session as any);

        const result = editor.getViewportCenterInCanvas();

        expect(result.equals(new Point(64, 32).round())).toBe(true);
    });

    it('computes canvas-space center from DOM metrics', () => {
        const session = {
            state: {
                display: new Point(128, 64),
                scale: new Point(1, 1),
            },
        };
        const editor = new Editor(session as any);

        editor.scrollContainer = {
            clientWidth: 200,
            clientHeight: 100,
        } as HTMLElement;

        const wrapper = {
            closest: vi.fn((_: string) => wrapper),
        } as unknown as HTMLElement;
        editor.container = wrapper;

        vi.spyOn(window, 'getComputedStyle').mockReturnValue({
            transform: 'translate(100px, 50px)',
        } as CSSStyleDeclaration);

        const result = editor.getViewportCenterInCanvas();

        // cx = (200/2 - 100) / 1 = 0, cy = (100/2 - 50) / 1 = 0
        expect(result.equals(new Point(0, 0))).toBe(true);
    });
});
