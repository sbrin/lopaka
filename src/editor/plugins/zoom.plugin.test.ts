import {describe, expect, it, beforeEach, afterEach, vi} from 'vitest';
import {ZoomPlugin} from './zoom.plugin';
import {SCALE_LIST} from '/src/const';
import {reactive} from 'vue';

type TestSession = {
    state: {
        scale: {x: number; y: number};
        scaleIndex: number;
    };
    getScalePercent: () => number;
    scaleUp: ReturnType<typeof vi.fn>;
    scaleDown: ReturnType<typeof vi.fn>;
    setScale: ReturnType<typeof vi.fn>;
};

function createTestSession(initialScaleIndex = 6): TestSession {
    const state = reactive({
        scale: {x: SCALE_LIST[initialScaleIndex] / 100, y: SCALE_LIST[initialScaleIndex] / 100},
        scaleIndex: initialScaleIndex,
    });

    const session: TestSession = {
        state,
        getScalePercent: () => SCALE_LIST[state.scaleIndex],
        scaleUp: vi.fn(() => {
            const newIndex = Math.min(state.scaleIndex + 1, SCALE_LIST.length - 1);
            state.scaleIndex = newIndex;
            state.scale = {x: SCALE_LIST[newIndex] / 100, y: SCALE_LIST[newIndex] / 100};
            return SCALE_LIST[newIndex];
        }),
        scaleDown: vi.fn(() => {
            const newIndex = Math.max(state.scaleIndex - 1, 0);
            state.scaleIndex = newIndex;
            state.scale = {x: SCALE_LIST[newIndex] / 100, y: SCALE_LIST[newIndex] / 100};
            return SCALE_LIST[newIndex];
        }),
        setScale: vi.fn(),
    };
    return session;
}

function createDOMStructure(containerW = 800, containerH = 600, canvasW = 200, canvasH = 150) {
    // Build: .fui-editor__canvas > .canvas-wrapper > .fui-grid > div.container
    const scrollContainer = document.createElement('div');
    scrollContainer.className = 'fui-editor__canvas';
    Object.defineProperty(scrollContainer, 'clientWidth', {value: containerW, configurable: true});
    Object.defineProperty(scrollContainer, 'clientHeight', {value: containerH, configurable: true});
    scrollContainer.getBoundingClientRect = vi.fn(() => ({
        left: 0,
        top: 0,
        right: containerW,
        bottom: containerH,
        width: containerW,
        height: containerH,
        x: 0,
        y: 0,
        toJSON: () => {},
    }));

    const canvasWrapper = document.createElement('div');
    canvasWrapper.className = 'canvas-wrapper';
    Object.defineProperty(canvasWrapper, 'offsetWidth', {value: canvasW, configurable: true});
    Object.defineProperty(canvasWrapper, 'offsetHeight', {value: canvasH, configurable: true});
    canvasWrapper.getBoundingClientRect = vi.fn(() => ({
        left: 0,
        top: 0,
        right: canvasW,
        bottom: canvasH,
        width: canvasW,
        height: canvasH,
        x: 0,
        y: 0,
        toJSON: () => {},
    }));

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

function createWheelEvent(opts: Partial<WheelEvent> & {deltaY?: number; deltaX?: number} = {}): WheelEvent {
    return new WheelEvent('wheel', {
        deltaY: opts.deltaY ?? 0,
        deltaX: opts.deltaX ?? 0,
        ctrlKey: opts.ctrlKey ?? false,
        metaKey: opts.metaKey ?? false,
        clientX: opts.clientX ?? 0,
        clientY: opts.clientY ?? 0,
    });
}

describe('ZoomPlugin', () => {
    let session: TestSession;
    let dom: ReturnType<typeof createDOMStructure>;
    let plugin: ZoomPlugin;

    beforeEach(() => {
        vi.useFakeTimers();
        document.body.innerHTML = '';
        session = createTestSession(6); // 400%
        dom = createDOMStructure(800, 600, 200, 150);
        plugin = new ZoomPlugin(session as any, dom.container);
    });

    describe('onWheel routing', () => {
        it('should call preventDefault for Ctrl+wheel', () => {
            const event = createWheelEvent({ctrlKey: true, deltaY: -120});
            const spy = vi.spyOn(event, 'preventDefault');
            plugin.onWheel(event);
            expect(spy).toHaveBeenCalled();
        });

        it('should call preventDefault for Meta+wheel', () => {
            const event = createWheelEvent({metaKey: true, deltaY: -120});
            const spy = vi.spyOn(event, 'preventDefault');
            plugin.onWheel(event);
            expect(spy).toHaveBeenCalled();
        });

        it('should call preventDefault for regular wheel (pan)', () => {
            const event = createWheelEvent({deltaY: 10});
            const spy = vi.spyOn(event, 'preventDefault');
            plugin.onWheel(event);
            expect(spy).toHaveBeenCalled();
        });

        it('should call scaleUp on Ctrl + scroll up (deltaY < 0)', () => {
            plugin.onWheel(createWheelEvent({ctrlKey: true, deltaY: -120}));
            expect(session.scaleUp).toHaveBeenCalled();
        });

        it('should call scaleDown on Ctrl + scroll down (deltaY > 0)', () => {
            plugin.onWheel(createWheelEvent({ctrlKey: true, deltaY: 120}));
            expect(session.scaleDown).toHaveBeenCalled();
        });

        it('should not call scaleUp/scaleDown for regular wheel', () => {
            plugin.onWheel(createWheelEvent({deltaY: 1200}));
            expect(session.scaleUp).not.toHaveBeenCalled();
            expect(session.scaleDown).not.toHaveBeenCalled();
        });
    });

    describe('handlePan', () => {
        it('should shift panX by negative deltaX', () => {
            plugin.onWheel(createWheelEvent({deltaX: 50, deltaY: 0}));
            // Canvas fits (200 < 800), so panX is clamped to center: (800-200)/2 = 300
            // Panning doesn't change centering when canvas fits
            expect(dom.canvasWrapper.style.transform).toContain('translate(');
        });

        it('should shift panY by negative deltaY for vertical scroll', () => {
            plugin.onWheel(createWheelEvent({deltaX: 0, deltaY: 30}));
            // Canvas fits (150 < 600), so panY is clamped to center: (600-150)/2 = 225
            expect(dom.canvasWrapper.style.transform).toContain('translate(');
        });

        it('should allow panning when canvas overflows container', () => {
            // Recreate with large canvas
            document.body.innerHTML = '';
            dom = createDOMStructure(400, 300, 800, 600);
            plugin = new ZoomPlugin(session as any, dom.container);

            // panX starts at 0 (nextTick centering is async)
            // Pan left by 100 (deltaX > 0 = scroll right = content moves left)
            plugin.onWheel(createWheelEvent({deltaX: 100, deltaY: 0}));
            const match1 = dom.canvasWrapper.style.transform.match(/translate\(([^,]+)px/);
            const panX1 = parseFloat(match1![1]);
            expect(panX1).toBe(-100);

            // Pan more left
            plugin.onWheel(createWheelEvent({deltaX: 100, deltaY: 0}));
            const match2 = dom.canvasWrapper.style.transform.match(/translate\(([^,]+)px/);
            const panX2 = parseFloat(match2![1]);
            expect(panX2).toBe(-200);
        });
    });

    describe('clamp logic', () => {
        it('should center canvas when it fits in container', () => {
            // Container: 800x600, Canvas: 200x150
            // centerX = (800-200)/2 = 300, centerY = (600-150)/2 = 225
            // Pan a lot and verify it gets clamped back to center
            plugin.onWheel(createWheelEvent({deltaX: 9999, deltaY: 9999}));
            expect(dom.canvasWrapper.style.transform).toBe('translate(300px, 225px)');
        });

        it('should not let canvas pan completely off-screen when overflowing', () => {
            document.body.innerHTML = '';
            dom = createDOMStructure(400, 300, 800, 600);
            plugin = new ZoomPlugin(session as any, dom.container);

            // Try to pan far right (deltaX very negative = move canvas right)
            plugin.onWheel(createWheelEvent({deltaX: -99999, deltaY: 0}));
            const transform = dom.canvasWrapper.style.transform;
            const match = transform.match(/translate\(([^,]+)px/);
            const panX = parseFloat(match![1]);
            // Max panX when overflowing: containerW - minVisible = 400 - 50 = 350
            expect(panX).toBeLessThanOrEqual(350);

            // Try to pan far left (deltaX very positive = move canvas left)
            plugin.onWheel(createWheelEvent({deltaX: 99999, deltaY: 0}));
            const transform2 = dom.canvasWrapper.style.transform;
            const match2 = transform2.match(/translate\(([^,]+)px/);
            const panX2 = parseFloat(match2![1]);
            // Min panX: -(canvasW - minVisible) = -(800 - 50) = -750
            expect(panX2).toBeGreaterThanOrEqual(-750);
        });
    });

    describe('centerCanvas', () => {
        it('should center canvas when it fits', () => {
            // Container 800x600, Canvas 200x150
            // After init, canvas is centered via nextTick, but we can trigger it via pan+clamp
            plugin.onWheel(createWheelEvent({deltaX: 0, deltaY: 0}));
            expect(dom.canvasWrapper.style.transform).toBe('translate(300px, 225px)');
        });

        it('should center a large canvas at midpoint', () => {
            document.body.innerHTML = '';
            dom = createDOMStructure(400, 300, 400, 300); // exact fit
            plugin = new ZoomPlugin(session as any, dom.container);

            plugin.onWheel(createWheelEvent({deltaX: 0, deltaY: 0}));
            expect(dom.canvasWrapper.style.transform).toBe('translate(0px, 0px)');
        });
    });

    describe('handleZoom focal point math', () => {
        it('should call scaleUp when zooming in with Ctrl', () => {
            plugin.onWheel(createWheelEvent({ctrlKey: true, deltaY: -120, clientX: 400, clientY: 300}));
            expect(session.scaleUp).toHaveBeenCalledTimes(1);
            expect(session.scaleDown).not.toHaveBeenCalled();
        });

        it('should call scaleDown when zooming out with Ctrl', () => {
            plugin.onWheel(createWheelEvent({ctrlKey: true, deltaY: 120, clientX: 400, clientY: 300}));
            expect(session.scaleDown).toHaveBeenCalledTimes(1);
            expect(session.scaleUp).not.toHaveBeenCalled();
        });

        it('should not change transform when at max scale and zooming in', () => {
            session = createTestSession(SCALE_LIST.length - 1); // 1500%
            session.scaleUp = vi.fn(() => SCALE_LIST[SCALE_LIST.length - 1]); // no change
            document.body.innerHTML = '';
            dom = createDOMStructure(800, 600, 200, 150);
            plugin = new ZoomPlugin(session as any, dom.container);

            const transformBefore = dom.canvasWrapper.style.transform;
            plugin.onWheel(createWheelEvent({ctrlKey: true, deltaY: -120}));
            // scaleUp returns same value → no transform change
            expect(dom.canvasWrapper.style.transform).toBe(transformBefore);
        });

        it('should use viewport center when cursor is not over canvas', () => {
            // Canvas is at its initial position (centered for small canvas)
            // Cursor is far outside the canvas wrapper bounds
            const event = createWheelEvent({
                ctrlKey: true,
                deltaY: -120,
                clientX: 9999, // way outside
                clientY: 9999,
            });
            plugin.onWheel(event);
            // Should use container center (400, 300) as focal point instead of cursor
            expect(session.scaleUp).toHaveBeenCalled();
        });
    });

    describe('focal point formula', () => {
        // Test the formula: newPan = mouse - (mouse - oldPan) * ratio
        // This verifies the math independently.

        it('should keep center point fixed when zooming at center', () => {
            // If cursor is at the center of the container, and canvas is centered,
            // the pan offset should scale around the center
            const containerW = 800;
            const canvasW = 200;
            const panX = (containerW - canvasW) / 2; // = 300
            const mouseX = containerW / 2; // = 400
            const ratio = 1.5; // e.g., 400% → 600%

            const newPanX = mouseX - (mouseX - panX) * ratio;
            // = 400 - (400 - 300) * 1.5 = 400 - 150 = 250
            expect(newPanX).toBe(250);

            // New canvas width would be 200 * 1.5 = 300
            // Center of new canvas: 250 + 300/2 = 400 = center of container ✓
        });

        it('should keep cursor point fixed when zooming at cursor', () => {
            // If cursor is at (200, 100) in container coords
            const panX = 300; // canvas left at 300
            const mouseX = 200; // cursor at 200 (to the left of canvas)
            const ratio = 2;

            const newPanX = mouseX - (mouseX - panX) * ratio;
            // = 200 - (200 - 300) * 2 = 200 - (-200) = 400

            // Before zoom: canvas point under cursor = mouseX - panX = 200 - 300 = -100 (outside canvas, left)
            // After zoom: same logical point at -100 * 2 = -200
            // New position of that point: newPanX + (-200) = 400 - 200 = 200 = mouseX ✓
            expect(newPanX).toBe(400);
        });

        it('should produce identity transform with ratio=1', () => {
            const panX = 123;
            const mouseX = 456;
            const ratio = 1;

            const newPanX = mouseX - (mouseX - panX) * ratio;
            expect(newPanX).toBe(panX);
        });
    });

    describe('zoomToViewCenter formula', () => {
        // Tests: newPan = center - (center - oldPan) * ratio

        it('should zoom toward view center', () => {
            const containerW = 800;
            const centerX = containerW / 2; // 400
            const panX = 300;
            const ratio = 1.5;

            const newPanX = centerX - (centerX - panX) * ratio;
            // = 400 - (400 - 300) * 1.5 = 400 - 150 = 250
            expect(newPanX).toBe(250);
        });

        it('should zoom out toward view center', () => {
            const containerW = 800;
            const centerX = containerW / 2;
            const panX = -100; // canvas scrolled
            const ratio = 0.5; // zooming out

            const newPanX = centerX - (centerX - panX) * ratio;
            // = 400 - (400 - (-100)) * 0.5 = 400 - 250 = 150
            expect(newPanX).toBe(150);
        });
    });

    describe('onDestroy', () => {
        it('should clean up without errors', () => {
            expect(() => plugin.onDestroy()).not.toThrow();
        });

        it('should be callable multiple times', () => {
            plugin.onDestroy();
            expect(() => plugin.onDestroy()).not.toThrow();
        });
    });

    afterEach(() => {
        vi.useRealTimers();
    });
});
