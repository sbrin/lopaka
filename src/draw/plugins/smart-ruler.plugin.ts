import {DrawPlugin} from './draw.plugin';
import {Point} from '../../core/point';

export class SmartRulerPlugin extends DrawPlugin {
    private mouseOverCanvas: boolean = false;

    public update(ctx: CanvasRenderingContext2D, point: Point | null, event: MouseEvent | TouchEvent | null): void {
        // Track mouse state based on events
        if (event) {
            switch (event.type) {
                case 'mousemove':
                case 'touchmove':
                case 'mouseenter':
                case 'touchstart':
                    this.mouseOverCanvas = true;
                    break;
                case 'mouseleave':
                case 'touchend':
                case 'touchcancel':
                    this.mouseOverCanvas = false;
                    break;
            }
        }

        const {scale, display} = this.session.state;
        const {layersManager} = this.session;
        const selected = layersManager.sorted.filter((layer) => layer.selected || layer.isEditing());
        const {interfaceColors} = this.session.getPlatformFeatures();
        const textColor = interfaceColors.rulerColor;
        const lineColor = interfaceColors.rulerLineColor;

        if (selected.length) {
            // Show ruler for selected layers
            const bounds = selected.reduce((bounds, layer) => bounds.extends(layer.bounds), selected[0].bounds);
            const p1 = bounds.pos.clone().multiply(scale).round().add(0.5, 0.5);
            const p2 = bounds.size.clone().multiply(scale).add(p1).round().subtract(0.5, 0.5);

            this.drawRulerLines(ctx, display, scale, textColor, lineColor, [
                {point: p1, xLabel: bounds.x, yLabel: bounds.y},
                ...(Math.abs(p1.distanceTo(p2)) > 10
                    ? [
                          {
                              point: p2,
                              xLabel: Math.round(bounds.w + bounds.x),
                              yLabel: Math.round(bounds.h + bounds.y),
                          },
                      ]
                    : []),
            ]);
        } else if (point) {
            // Draw crosshair when nothing is selected but mouse is over canvas
            // Only show rulers when mouse is over canvas
            if (!this.mouseOverCanvas) {
                return;
            }
            const logicalPoint = point.clone().divide(scale).round();
            const canvasPoint = logicalPoint.clone().multiply(scale).round().add(0.5, 0.5);

            this.drawRulerLines(ctx, display, scale, textColor, lineColor, [
                {
                    point: canvasPoint,
                    xLabel: logicalPoint.x,
                    yLabel: logicalPoint.y,
                },
            ]);
        }
    }

    private drawRulerLines(
        ctx: CanvasRenderingContext2D,
        display: Point,
        scale: Point,
        textColor: string,
        lineColor: string,
        points: Array<{point: Point; xLabel: number; yLabel: number}>
    ): void {
        ctx.save();
        ctx.beginPath();
        ctx.font = '10px sans-serif';
        const maxPoint = display.clone().multiply(scale).round();

        for (const {point, xLabel, yLabel} of points) {
            // Draw horizontal line (extends past canvas for right label)
            ctx.moveTo(-9, point.y);
            ctx.lineTo(maxPoint.x + 9, point.y);

            // Draw vertical line (extends past canvas for bottom label)
            ctx.moveTo(point.x, -9);
            ctx.lineTo(point.x, maxPoint.y + 9);

            // Draw coordinate labels
            ctx.fillStyle = textColor;

            // Left label
            ctx.textBaseline = 'middle';
            ctx.textAlign = 'right';
            ctx.fillText(`${yLabel}`, -12, point.y);

            // Top label
            ctx.textBaseline = 'bottom';
            ctx.textAlign = 'center';
            ctx.fillText(`${xLabel}`, point.x, -12);

            // Right label
            ctx.textBaseline = 'middle';
            ctx.textAlign = 'left';
            ctx.fillText(`${yLabel}`, maxPoint.x + 12, point.y);

            // Bottom label
            ctx.textBaseline = 'top';
            ctx.textAlign = 'center';
            ctx.fillText(`${xLabel}`, point.x, maxPoint.y + 12);
        }

        ctx.strokeStyle = lineColor;
        ctx.setLineDash([1, 4]);
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.restore();
    }
}
