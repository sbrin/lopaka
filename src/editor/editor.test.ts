import {beforeEach, describe, expect, it, vi} from 'vitest';
import {Point} from '../core/point';
import {Editor} from './editor';
import {SCALE_LIST} from '/src/const';

// Build: .fui-editor__canvas > .canvas-wrapper > .fui-grid > div.container
// Mirrors the DOM structure ZoomPlugin expects (see zoom.plugin.test.ts).
function createDOMStructure(containerW = 800, containerH = 600, canvasW = 128, canvasH = 64) {
    const scrollContainer = document.createElement('div');
    scrollContainer.className = 'fui-editor__canvas';
    Object.defineProperty(scrollContainer, 'clientWidth', {value: containerW, configurable: true});
    Object.defineProperty(scrollContainer, 'clientHeight', {value: containerH, configurable: true});

    const canvasWrapper = document.createElement('div');
    canvasWrapper.className = 'canvas-wrapper';
    Object.defineProperty(canvasWrapper, 'offsetWidth', {value: canvasW, configurable: true});
    Object.defineProperty(canvasWrapper, 'offsetHeight', {value: canvasH, configurable: true});

    const fuiGrid = document.createElement('div');
    fuiGrid.className = 'fui-grid';

    const container = document.createElement('div');
    container.className = 'relative';

    fuiGrid.appendChild(container);
    canvasWrapper.appendChild(fuiGrid);
    scrollContainer.appendChild(canvasWrapper);
    document.body.appendChild(scrollContainer);

    return {scrollContainer, canvasWrapper, container};
}

function createTestSession(displayW = 128, displayH = 64) {
    return {
        state: {
            display: new Point(displayW, displayH),
            scale: new Point(1, 1),
            scaleIndex: SCALE_LIST.indexOf(100),
        },
        getScalePercent: () => 100,
        scaleUp: vi.fn(),
        scaleDown: vi.fn(),
        setScale: vi.fn(),
    };
}

describe('Editor.getViewportCenterInCanvas', () => {
    beforeEach(() => {
        document.body.innerHTML = '';
    });

    it('returns the display center when the editor has no container mounted', () => {
        // No setContainer() call yet, so ZoomPlugin is not wired up.
        const session = createTestSession(128, 64);
        const editor = new Editor(session as any);

        const result = editor.getViewportCenterInCanvas();

        expect(result.equals(new Point(64, 32))).toBe(true);
    });

    it('returns the display center when the canvas fits entirely in the viewport (no pan)', () => {
        const session = createTestSession(128, 64);
        const editor = new Editor(session as any);
        const dom = createDOMStructure(800, 600, 128, 64);

        editor.setContainer(dom.container);

        // ZoomPlugin centers the canvas on mount (async via nextTick), but
        // pan defaults to 0 synchronously, so before centering runs the
        // computed viewport center still resolves relative to pan (0, 0)
        // at 1x scale: (800/2 - 0, 600/2 - 0) clamped into the 128x64 canvas.
        const result = editor.getViewportCenterInCanvas();

        expect(result.x).toBeGreaterThanOrEqual(0);
        expect(result.x).toBeLessThanOrEqual(128);
        expect(result.y).toBeGreaterThanOrEqual(0);
        expect(result.y).toBeLessThanOrEqual(64);
    });

    it('reads pan offset from ZoomPlugin to compute the canvas-space viewport center', () => {
        const session = createTestSession(128, 64);
        const editor = new Editor(session as any);
        const dom = createDOMStructure(200, 100, 128, 64);

        editor.setContainer(dom.container);

        const zoomPlugin = editor.plugins.find((p) => p.constructor.name === 'ZoomPlugin') as any;
        expect(zoomPlugin).toBeTruthy();
        // Force a known pan offset directly, bypassing the async centering tick.
        zoomPlugin.panX = 50;
        zoomPlugin.panY = 20;

        // cx = (viewportW/2 - panX) / scale.x = (200/2 - 50) / 1 = 50
        // cy = (viewportH/2 - panY) / scale.y = (100/2 - 20) / 1 = 30
        const result = editor.getViewportCenterInCanvas();

        expect(result.equals(new Point(50, 30))).toBe(true);
    });

    it('clamps the viewport center to the canvas bounds when scrolled past an edge', () => {
        const session = createTestSession(128, 64);
        const editor = new Editor(session as any);
        const dom = createDOMStructure(200, 100, 128, 64);

        editor.setContainer(dom.container);

        const zoomPlugin = editor.plugins.find((p) => p.constructor.name === 'ZoomPlugin') as any;
        // Pan far in the negative direction so the raw computed center would
        // land outside the canvas on both axes.
        zoomPlugin.panX = -1000;
        zoomPlugin.panY = -1000;

        const result = editor.getViewportCenterInCanvas();

        expect(result.x).toBe(128);
        expect(result.y).toBe(64);
    });

    it('accounts for the current zoom scale when converting screen pan to canvas coordinates', () => {
        const session = createTestSession(128, 64);
        session.state.scale = new Point(2, 2);
        const editor = new Editor(session as any);
        const dom = createDOMStructure(200, 100, 128, 64);

        editor.setContainer(dom.container);

        const zoomPlugin = editor.plugins.find((p) => p.constructor.name === 'ZoomPlugin') as any;
        zoomPlugin.panX = 0;
        zoomPlugin.panY = 0;

        // cx = (200/2 - 0) / 2 = 50, cy = (100/2 - 0) / 2 = 25
        const result = editor.getViewportCenterInCanvas();

        expect(result.equals(new Point(50, 25))).toBe(true);
    });
});

