import {Point} from '../core/point';

export class DrawContext {
    ctx: OffscreenCanvasRenderingContext2D;
    constructor(private canvas: OffscreenCanvas) {
        this.ctx = canvas.getContext('2d', {
            alpha: true,
            desynchronized: true,
            willReadFrequently: true
        });
    }

    clear(): DrawContext {
        this.ctx.clearRect(-1, -1, this.canvas.width + 1, this.canvas.height + 1);
        return this;
    }

    drawImage(image: OffscreenCanvas, position: Point) {
        this.ctx.drawImage(image, position.x, position.y);
    }

    line(from: Point, to: Point): DrawContext {
        this.ctx.beginPath();
        this.ctx.moveTo(from.x, from.y);
        this.ctx.lineTo(to.x, to.y);
        this.ctx.stroke();
        return this;
    }

    rect(position: Point, size: Point, fill: boolean): DrawContext {
        if (fill) {
            this.ctx.fillRect(position.x, position.y, size.x, size.y);
        } else {
            this.ctx.strokeRect(position.x, position.y, size.x, size.y);
        }
        return this;
    }

    circle(position: Point, radius: number, fill: boolean): DrawContext {
        radius = Math.max(1, radius);
        this.ctx.beginPath();
        this.ctx.arc(position.x, position.y, radius - 1, 0, 2 * Math.PI);
        if (fill) {
            this.ctx.fill();
        }
        this.ctx.stroke();
        this.ctx.closePath();
        return this;
    }

    text(position: Point, text: string, font: string): DrawContext {
        this.ctx.font = font;
        this.ctx.textBaseline = 'top';
        this.ctx.fillText(text, position.x, position.y);
        return this;
    }

    pixelateLine(from: Point, to: Point, size: number): DrawContext {
        const distance = from.distanceTo(to);
        const steps = Math.ceil(distance / size);
        const step = to.clone().subtract(from).divide(steps);
        for (let i = 0; i < steps; i++) {
            this.rect(from.clone().add(step.clone().multiply(i)), new Point(size, size), true);
        }
        return this;
    }

    pixelateCircle(position: Point, size: Point, fill: boolean): DrawContext {
        const radius = size.x / 2;
        const steps = Math.ceil((2 * Math.PI * radius) / size.x);
        const step = (2 * Math.PI) / steps;
        for (let i = 0; i < steps; i++) {
            this.rect(
                new Point(position.x + radius * Math.cos(step * i), position.y + radius * Math.sin(step * i)),
                size.clone(),
                fill
            );
        }
        return this;
    }
}
