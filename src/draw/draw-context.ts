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

    drawImage(image: OffscreenCanvas | ImageData, position: Point) {
        if (image instanceof ImageData) {
            this.ctx.putImageData(image, position.x, position.y);
        } else {
            this.ctx.drawImage(image, position.x, position.y);
        }
    }

    line(from: Point, to: Point): DrawContext {
        this.ctx.beginPath();
        this.ctx.moveTo(from.x, from.y);
        this.ctx.lineTo(to.x, to.y);
        this.ctx.stroke();
        this.ctx.closePath();
        return this;
    }

    rect(position: Point, size: Point, fill: boolean): DrawContext {
        this.ctx.beginPath();
        if (fill) {
            this.ctx.rect(position.x, position.y, size.x, size.y);
        } else {
            this.ctx.rect(position.x, position.y, size.x, 1);
            this.ctx.rect(position.x, position.y + size.y - 1, size.x, 1);
            this.ctx.rect(position.x, position.y, 1, size.y);
            this.ctx.rect(position.x + size.x - 1, position.y, 1, size.y);
        }
        this.ctx.fill();
        if (!fill) {
            this.ctx.save();
            this.ctx.fillStyle = 'rgba(0,0,0,0)';
            this.ctx.beginPath();
            this.ctx.rect(position.x, position.y, size.x, size.y);
            this.ctx.fill();
            this.ctx.restore();
        }
        this.ctx.closePath();
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
        const a = from.clone().round();
        const b = to.clone().round();
        const dx = Math.abs(a.x - b.x);
        const dy = Math.abs(a.y - b.y);
        const sx = a.x < b.x ? 1 : -1;
        const sy = a.y < b.y ? 1 : -1;
        let err = dx - dy;
        this.ctx.beginPath();
        while (true) {
            this.ctx.rect(a.x, a.y, size, size);
            if (a.x === b.x && a.y === b.y) break;
            const e2 = 2 * err;
            if (e2 > -dy) {
                err -= dy;
                a.x += sx;
            }
            if (e2 < dx) {
                err += dx;
                a.y += sy;
            }
        }
        this.ctx.fill();
        this.ctx.closePath();
        return this;
    }

    pixelateCircle(center: Point, radius: number, fill: boolean): DrawContext {
        this.ctx.beginPath();
        for (let n = 0; n < radius; n++) {
            const x = n;
            const y = Math.round(Math.sqrt(radius * radius - x * x));
            this.ctx.rect(center.x - x, center.y - y, 1, 1);
            this.ctx.rect(center.x - x, center.y + y, 1, 1);
            this.ctx.rect(center.x + x, center.y - y, 1, 1);
            this.ctx.rect(center.x + x, center.y + y, 1, 1);
            this.ctx.rect(center.x - y, center.y - x, 1, 1);
            this.ctx.rect(center.x - y, center.y + x, 1, 1);
            this.ctx.rect(center.x + y, center.y - x, 1, 1);
            this.ctx.rect(center.x + y, center.y + x, 1, 1);
            if (fill) {
                this.ctx.rect(center.x - x, center.y - y, 1, y * 2);
                this.ctx.rect(center.x + x, center.y - y, 1, y * 2);
                this.ctx.rect(center.x - y, center.y - x, 1, x * 2);
                this.ctx.rect(center.x + y, center.y - x, 1, x * 2);
            }
        }
        this.ctx.fill();
        this.ctx.closePath();
        return this;
    }

    pixelateRectCorner(point: Point, radius: number, quadrant: number, fill: boolean): DrawContext {
        const signs = new Point(quadrant == 0 || quadrant == 3 ? 1 : -1, quadrant == 0 || quadrant == 1 ? 1 : -1);
        const center = point.clone().add(new Point(radius).multiply(signs));
        for (let x = 0; x < radius; x++) {
            let y = Math.sqrt(radius * radius - x * x);
            let p = center.clone().subtract(new Point(x, y).multiply(signs)).round();
            this.ctx.rect(p.x, p.y, 1, 1);
            fill && this.ctx.fillRect(p.x, p.y, 1, signs.y * (radius - Math.abs(p.y - point.y)));
            p = center.clone().subtract(new Point(y, x).multiply(signs)).round();
            this.ctx.rect(p.x, p.y, 1, 1);
        }
        return this;
    }

    pixelateRoundedRect(position: Point, size: Point, radius: number, fill: boolean): DrawContext {
        this.ctx.beginPath();
        this.ctx.rect(position.x + radius, position.y, size.x - 2 * radius, 1);
        this.ctx.rect(position.x + radius, position.y + size.y - 1, size.x - 2 * radius, 1);
        this.ctx.rect(position.x, position.y + radius, 1, size.y - 2 * radius);
        this.ctx.rect(position.x + size.x - 1, position.y + radius, 1, size.y - 2 * radius);
        if (fill) {
            this.ctx.fillRect(position.x + radius, position.y, size.x - 2 * radius, size.y);
            this.ctx.fillRect(position.x, position.y + radius, size.x, size.y - 2 * radius);
        }
        this.pixelateRectCorner(position, radius + 1, 0, fill);
        this.pixelateRectCorner(new Point(position.x + size.x - 1, position.y), radius + 1, 1, fill);
        this.pixelateRectCorner(new Point(position.x + size.x - 1, position.y + size.y - 1), radius + 1, 2, fill);
        this.pixelateRectCorner(new Point(position.x, position.y + size.y - 1), radius + 1, 3, fill);
        this.ctx.fill();
        if (fill) {
            this.ctx.save();
            this.ctx.fillStyle = 'rgba(0,0,0,0)';
            this.ctx.beginPath();
            this.ctx.arc(position.x + radius, position.y + radius, radius, Math.PI, 1.5 * Math.PI);
            this.ctx.arc(position.x + size.x - radius, position.y + radius, radius, 1.5 * Math.PI, 2 * Math.PI);
            this.ctx.arc(position.x + size.x - radius, position.y + size.y - radius, radius, 0, 0.5 * Math.PI);
            this.ctx.arc(position.x + radius, position.y + size.y - radius, radius, 0.5 * Math.PI, Math.PI);
            this.ctx.fill();
        }
        return this;
    }

    pixelateEllipse(center: Point, radiusX: number, radiusY: number, fill: boolean): DrawContext {
        this.ctx.beginPath();
        for (let n = 0; n < radiusX; n++) {
            const x = n;
            const y = Math.round(Math.sqrt(radiusY * radiusY * (1 - (x * x) / radiusX / radiusX)));
            this.ctx.rect(center.x - x, center.y - y, 1, 1);
            this.ctx.rect(center.x - x, center.y + y, 1, 1);
            this.ctx.rect(center.x + x, center.y - y, 1, 1);
            this.ctx.rect(center.x + x, center.y + y, 1, 1);
            if (fill) {
                this.ctx.rect(center.x - x, center.y - y, 1, y * 2);
                this.ctx.rect(center.x + x, center.y - y, 1, y * 2);
            }
        }
        for (let n = 0; n < radiusY; n++) {
            const y = n;
            const x = Math.round(Math.sqrt(radiusX * radiusX * (1 - (y * y) / radiusY / radiusY)));
            this.ctx.rect(center.x - x, center.y - y, 1, 1);
            this.ctx.rect(center.x - x, center.y + y, 1, 1);
            this.ctx.rect(center.x + x, center.y - y, 1, 1);
            this.ctx.rect(center.x + x, center.y + y, 1, 1);
            if (fill) {
                this.ctx.rect(center.x - x, center.y - y, 1, y * 2);
                this.ctx.rect(center.x + x, center.y - y, 1, y * 2);
            }
        }
        this.ctx.fill();
        if (!fill) {
            this.ctx.save();
            this.ctx.fillStyle = 'rgba(0,0,0,0)';
            this.ctx.beginPath();
            this.ctx.ellipse(center.x + 0.5, center.y + 0.5, radiusX + 0.5, radiusY + 0.5, 0, 0, 2 * Math.PI);
            this.ctx.fill();
            this.ctx.restore();
        }
        this.ctx.closePath();
        return this;
    }
}
