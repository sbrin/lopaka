import { nextTick, watch, WatchStopHandle } from 'vue';
import { SCALE_LIST } from '/src/const';
import { Session } from '../../core/session';
import { AbstractEditorPlugin } from './abstract-editor.plugin';

export class ZoomPlugin extends AbstractEditorPlugin {
    private panX = 0;
    private panY = 0;
    private canvasWrapper: HTMLElement | null = null;
    private scrollContainer: HTMLElement | null = null;
    private resizeObserver: ResizeObserver | null = null;
    private stopWatch: WatchStopHandle | null = null;
    private isWheelZooming = false;

    constructor(session: Session, container: HTMLElement) {
        super(session, container);
        this.init();
    }

    private getCanvasWrapper(): HTMLElement | null {
        if (!this.canvasWrapper) {
            this.canvasWrapper = this.container.closest('.canvas-wrapper');
        }
        return this.canvasWrapper;
    }

    private getScrollContainer(): HTMLElement | null {
        if (!this.scrollContainer) {
            this.scrollContainer = this.container.closest('.fui-editor__canvas');
        }
        return this.scrollContainer;
    }

    private init(): void {
        const sc = this.getScrollContainer();
        const cw = this.getCanvasWrapper();
        if (!sc || !cw) return;

        // Watch for external scale changes (slider, keyboard shortcuts)
        this.stopWatch = watch(
            () => this.session.state.scaleIndex,
            (newIdx, oldIdx) => {
                if (this.isWheelZooming) return;
                if (oldIdx === undefined || newIdx === oldIdx) return;
                const ratio = SCALE_LIST[newIdx] / SCALE_LIST[oldIdx];
                nextTick(() => {
                    this.zoomToViewCenter(ratio);
                });
            },
            { flush: 'sync' }
        );

        // Watch for container resize (window resize)
        this.resizeObserver = new ResizeObserver(() => {
            this.centerCanvas();
        });
        this.resizeObserver.observe(sc);

        // Initial centering after DOM is ready
        nextTick(() => this.centerCanvas());
    }

    onWheel(event: WheelEvent): void {
        if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            this.handleZoom(event);
        } else {
            event.preventDefault();
            this.handlePan(event);
        }
    }

    private lastZoomTime = 0;

    private handleZoom(event: WheelEvent): void {
        const sc = this.getScrollContainer();
        const cw = this.getCanvasWrapper();
        if (!sc || !cw) return;

        const now = Date.now();
        if (now - this.lastZoomTime < 100) {
            return;
        }

        const oldPercent = this.session.getScalePercent();

        this.isWheelZooming = true;
        if (event.deltaY < 0) {
            this.session.scaleUp();
        } else if (event.deltaY > 0) {
            this.session.scaleDown();
        }

        this.lastZoomTime = now;

        const newPercent = this.session.getScalePercent();
        if (newPercent === oldPercent) {
            this.isWheelZooming = false;
            return;
        }

        const ratio = newPercent / oldPercent;
        const scRect = sc.getBoundingClientRect();

        // Cursor position relative to scroll container
        let mouseX = event.clientX - scRect.left;
        let mouseY = event.clientY - scRect.top;

        // Check if cursor is over the canvas
        const cwRect = cw.getBoundingClientRect();
        const isOverCanvas =
            event.clientX >= cwRect.left &&
            event.clientX <= cwRect.right &&
            event.clientY >= cwRect.top &&
            event.clientY <= cwRect.bottom;

        if (!isOverCanvas) {
            mouseX = sc.clientWidth / 2;
            mouseY = sc.clientHeight / 2;
        }

        // Focal-point zoom: keep the point under cursor fixed
        const newPanX = mouseX - (mouseX - this.panX) * ratio;
        const newPanY = mouseY - (mouseY - this.panY) * ratio;

        nextTick(() => {
            this.panX = newPanX;
            this.panY = newPanY;
            this.clampPan();
            this.applyTransform();
            this.isWheelZooming = false;
        });
    }

    private handlePan(event: WheelEvent): void {
        this.panX -= event.deltaX;
        this.panY -= event.deltaY;
        this.clampPan();
        this.applyTransform();
    }

    private zoomToViewCenter(ratio: number): void {
        const sc = this.getScrollContainer();
        if (!sc) return;

        const centerX = sc.clientWidth / 2;
        const centerY = sc.clientHeight / 2;

        this.panX = centerX - (centerX - this.panX) * ratio;
        this.panY = centerY - (centerY - this.panY) * ratio;
        this.clampPan();
        this.applyTransform();
    }

    private centerCanvas(): void {
        const sc = this.getScrollContainer();
        const cw = this.getCanvasWrapper();
        if (!sc || !cw) return;

        const containerW = sc.clientWidth;
        const containerH = sc.clientHeight;
        const canvasW = cw.offsetWidth;
        const canvasH = cw.offsetHeight;

        this.panX = (containerW - canvasW) / 2;
        this.panY = (containerH - canvasH) / 2;
        this.applyTransform();
    }

    private clampPan(): void {
        const sc = this.getScrollContainer();
        const cw = this.getCanvasWrapper();
        if (!sc || !cw) return;

        const containerW = sc.clientWidth;
        const containerH = sc.clientHeight;
        const canvasW = cw.offsetWidth;
        const canvasH = cw.offsetHeight;

        if (canvasW <= containerW) {
            // Canvas fits — center it
            this.panX = (containerW - canvasW) / 2;
        } else {
            // Canvas overflows — keep at least some visible
            const minVisible = containerW / 2;
            this.panX = Math.max(-(canvasW - minVisible), Math.min(containerW - minVisible, this.panX));
        }

        if (canvasH <= containerH) {
            this.panY = (containerH - canvasH) / 2;
        } else {
            const minVisible = containerH / 2;
            this.panY = Math.max(-(canvasH - minVisible), Math.min(containerH - minVisible, this.panY));
        }
    }

    private applyTransform(): void {
        const cw = this.getCanvasWrapper();
        if (!cw) return;
        cw.style.transform = `translate(${this.panX}px, ${this.panY}px)`;
    }

    onDestroy(): void {
        if (this.stopWatch) {
            this.stopWatch();
            this.stopWatch = null;
        }
        if (this.resizeObserver) {
            this.resizeObserver.disconnect();
            this.resizeObserver = null;
        }
    }
}
