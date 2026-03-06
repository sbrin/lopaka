import { AbstractDrawingRenderer } from './abstract-drawing-renderer';
import { Point } from '../../core/point';
import { Font } from '../fonts/font';
import {
    LVGL_CHECKBOX_BOX_SIZE,
    LVGL_CHECKBOX_TEXT_GAP,
    LVGL_CHECKBOX_TEXT_SCALE,
    LVGL_CHECKBOX_RADIUS,
    LVGL_DEFAULT_COLOR_SECONDARY,
} from '../../platforms/lvgl/constants';

/**
 * Smooth drawing renderer for LVGL and other platforms that need vector-based drawing
 * Uses native canvas drawing methods for smooth, anti-aliased rendering
 */
export class SmoothDrawingRenderer extends AbstractDrawingRenderer {
    clear(): void {
        this.drawContext.clear();
    }

    drawRect(position: Point, size: Point, fill: boolean, color: string): void {
        this.clear();
        const ctx = this.drawContext.ctx;
        this.setColor(color);

        if (fill) {
            ctx.fillRect(position.x + 0.5, position.y + 0.5, size.x, size.y);
        } else {
            ctx.strokeRect(position.x + 0.5, position.y + 0.5, size.x, size.y);
        }
    }

    drawRoundedRect(position: Point, size: Point, radius: number, fill: boolean, color: string): void {
        this.clear();
        const ctx = this.drawContext.ctx;
        this.setColor(color);

        ctx.beginPath();
        ctx.roundRect(position.x + 0.5, position.y + 0.5, size.x, size.y, radius);

        if (fill) {
            ctx.fill();
        } else {
            ctx.stroke();
        }
    }

    drawCircle(center: Point, radius: number, fill: boolean, color: string): void {
        this.clear();
        const ctx = this.drawContext.ctx;
        this.setColor(color);

        ctx.beginPath();
        ctx.arc(center.x + 0.5, center.y + 0.5, radius, 0, 2 * Math.PI);

        if (fill) {
            ctx.fill();
        } else {
            ctx.stroke();
        }
    }

    drawEllipse(center: Point, radiusX: number, radiusY: number, fill: boolean, color: string): void {
        this.clear();
        const ctx = this.drawContext.ctx;
        this.setColor(color);

        ctx.beginPath();
        ctx.ellipse(center.x + 0.5, center.y + 0.5, radiusX, radiusY, 0, 0, 2 * Math.PI);

        if (fill) {
            ctx.fill();
        } else {
            ctx.stroke();
        }
    }

    drawLine(from: Point, to: Point, color: string): void {
        this.clear();
        const ctx = this.drawContext.ctx;
        this.setColor(color);

        ctx.beginPath();
        ctx.moveTo(from.x + 0.5, from.y + 0.5);
        ctx.lineTo(to.x + 0.5, to.y + 0.5);
        ctx.stroke();
    }

    drawTriangle(p1: Point, p2: Point, p3: Point, fill: boolean, color: string): void {
        this.clear();
        const ctx = this.drawContext.ctx;
        this.setColor(color);

        ctx.beginPath();
        ctx.moveTo(p1.x + 0.5, p1.y + 0.5);
        ctx.lineTo(p2.x + 0.5, p2.y + 0.5);
        ctx.lineTo(p3.x + 0.5, p3.y + 0.5);
        ctx.closePath();

        if (fill) {
            ctx.fill();
        } else {
            ctx.stroke();
        }
    }

    drawPolygon(points: Point[], fill: boolean, color: string): void {
        this.clear();
        const ctx = this.drawContext.ctx;
        this.setColor(color);

        if (points.length < 2) return;

        ctx.beginPath();
        ctx.moveTo(points[0].x + 0.5, points[0].y + 0.5);
        for (let i = 1; i < points.length; i++) {
            ctx.lineTo(points[i].x + 0.5, points[i].y + 0.5);
        }
        ctx.closePath();

        if (fill) {
            ctx.fill();
        } else {
            ctx.stroke();
        }
    }

    drawImage(imageData: ImageData, position: Point): void {
        this.clear();
        this.drawContext.ctx.putImageData(imageData, position.x, position.y);
    }

    drawButton(
        position: Point,
        size: Point,
        radius: number,
        backgroundColor: string,
        text: string,
        textColor: string,
        font?: Font
    ): void {
        this.clear();
        const ctx = this.drawContext.ctx;

        // Draw shadow
        this.setColor(LVGL_DEFAULT_COLOR_SECONDARY);
        ctx.save();
        ctx.globalAlpha = 0.4;
        ctx.beginPath();
        ctx.roundRect(position.x, position.y + 2, size.x, size.y, radius);
        ctx.fill();
        ctx.restore();

        // Draw smooth button background
        this.setColor(backgroundColor);
        ctx.beginPath();
        ctx.roundRect(position.x, position.y, size.x, size.y, radius);
        ctx.fill();


        // Draw text if provided
        if (text && font) {
            ctx.save();
            ctx.beginPath();
            ctx.roundRect(position.x, position.y, size.x, size.y, radius);
            ctx.clip();

            this.setColor(textColor);

            // Calculate centered text position
            const textSize = font.getSize(this.drawContext, text, 15);
            const textX = position.x + (size.x - textSize.x) / 2;
            const textY = position.y + size.y / 2 + 3;

            font.drawText(this.drawContext, text, new Point(textX, textY), 15, 'middle');
            ctx.restore();
        }
    }

    drawSwitch(
        position: Point,
        size: Point,
        checked: boolean,
        color: string,
        backgroundColor: string
    ): void {
        this.clear();
        const ctx = this.drawContext.ctx;

        // Determine background color based on state
        const bgColor = checked ? color : backgroundColor;

        // Draw the pill background
        this.setColor(bgColor);
        ctx.beginPath();
        const radius = Math.min(size.x, size.y) / 2;
        ctx.roundRect(position.x, position.y, size.x, size.y, radius);
        ctx.fill();

        // Draw the knob
        const knobPadding = 3; // Padding between knob and edge
        // Constrain knob size to fit in both dimensions
        const knobDiameter = Math.min(size.x, size.y) - (knobPadding * 2);
        const knobRadius = knobDiameter / 2;

        // Safety check to avoid negative radii
        if (knobRadius <= 0) return;

        let knobX, knobY;
        const isVertical = size.y > size.x;

        if (isVertical) {
            // Vertical orientation
            // Center horizontally
            knobX = position.x + (size.x - knobDiameter) / 2;

            if (checked) {
                // Top (ON)
                knobY = position.y + knobPadding;
            } else {
                // Bottom (OFF)
                knobY = position.y + size.y - knobDiameter - knobPadding;
            }
        } else {
            // Horizontal orientation
            if (checked) {
                // Right side (ON)
                knobX = position.x + size.x - knobDiameter - knobPadding;
            } else {
                // Left side (OFF)
                knobX = position.x + knobPadding;
            }
            // Center vertically
            knobY = position.y + (size.y - knobDiameter) / 2;
        }

        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(knobX + knobRadius, knobY + knobRadius, knobRadius, 0, 2 * Math.PI);
        ctx.fill();
    }

    drawSlider(
        position: Point,
        size: Point,
        value: number,
        color: string
    ): void {
        this.clear();
        const ctx = this.drawContext.ctx;

        // Decide orientation based on aspect ratio.
        const isVertical = size.y > size.x;
        const trackHeight = size.y;
        const trackWidth = size.x;
        const trackRadius = trackHeight;

        // Draw the track background with 50% transparency.
        ctx.save();
        ctx.globalAlpha = 0.3;
        this.setColor(color);
        ctx.beginPath();
        ctx.roundRect(position.x, position.y, trackWidth, trackHeight, trackRadius);
        ctx.fill();
        ctx.restore();

        // Draw the filled portion of the track (active part).
        // Keep filled thickness readable on very thin tracks.
        const minFillThickness = 6;
        if (isVertical) {
            // Fill from bottom to top for vertical sliders.
            const fillHeight = (value / 100) * trackHeight;
            if (fillHeight > 0) {
                // Expand the filled thickness without changing the track size.
                const fillWidth = Math.max(minFillThickness, trackWidth);
                const fillX = position.x + (trackWidth - fillWidth) / 2;
                this.setColor(color);
                ctx.beginPath();
                ctx.roundRect(
                    fillX,
                    position.y + trackHeight - fillHeight,
                    fillWidth,
                    fillHeight,
                    trackRadius
                );
                ctx.fill();
            }
        } else {
            // Fill from left to right for horizontal sliders.
            const fillWidth = (value / 100) * trackWidth;
            if (fillWidth > 0) {
                // Expand the filled thickness without changing the track size.
                const fillHeight = Math.max(minFillThickness, trackHeight);
                const fillY = position.y + (trackHeight - fillHeight) / 2;
                this.setColor(color);
                ctx.beginPath();
                ctx.roundRect(position.x, fillY, fillWidth, fillHeight, trackRadius);
                ctx.fill();
            }
        }

        // Use track thickness as the base for the knob sizing curve.
        const thickness = Math.max(1, Math.min(trackWidth, trackHeight));
        // Define the minimum knob size and the maximum lag from the track thickness.
        const minKnobDiameter = 12;
        const maxTrackLag = 10;
        // Clamp the knob size to the minimum and limit it to at most 10px smaller than the track.
        const knobDiameter = Math.max(
            minKnobDiameter,
            thickness + maxTrackLag
        );
        // Derive the knob radius from the final diameter.
        const knobRadius = knobDiameter / 2;

        // Calculate knob position based on value and orientation.
        let knobX = position.x;
        let knobY = position.y;
        if (isVertical) {
            // Keep the knob centered horizontally in vertical mode.
            const knobTrackHeight = trackHeight - knobDiameter;
            knobX = position.x + (trackWidth - knobDiameter) / 2;
            knobY = position.y + (1 - value / 100) * knobTrackHeight;
        } else {
            // Keep the knob centered vertically in horizontal mode.
            const knobTrackWidth = trackWidth - knobDiameter;
            knobX = position.x + (value / 100) * knobTrackWidth;
            knobY = position.y + (trackHeight - knobDiameter) / 2;
        }

        // Draw the knob.
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(knobX + knobRadius, knobY + knobRadius, knobRadius, 0, 2 * Math.PI);
        ctx.fill();
    }



    drawText(position: Point, text: string, font: Font, scaleFactor: number, color: string): void {
        this.clear();
        this.setColor(color);
        font.drawText(this.drawContext, text, position.clone(), scaleFactor);
    }

    drawPanel(
        position: Point,
        size: Point,
        radius: number,
        backgroundColor: string,
        borderColor: string,
        borderWidth: number
    ): void {
        this.clear();
        const ctx = this.drawContext.ctx;

        // Draw background (filled rounded rectangle)
        if (backgroundColor) {
            ctx.fillStyle = backgroundColor;
            ctx.beginPath();
            if (radius > 0) {
                ctx.roundRect(position.x, position.y, size.x, size.y, radius);
            } else {
                ctx.rect(position.x, position.y, size.x, size.y);
            }
            ctx.fill();
        }

        // Draw border (stroked rounded rectangle)
        if (borderWidth > 0 && borderColor) {
            ctx.strokeStyle = borderColor;
            ctx.lineWidth = borderWidth;
            const modifier = borderWidth === 1 ? 0 : 0;
            // Clamp the inner radius to avoid negative values when borders are thicker than corners.
            const strokeRadius = Math.max(0, radius - borderWidth / 2);
            ctx.beginPath();
            if (strokeRadius > 0) {
                ctx.roundRect(
                    position.x + modifier + borderWidth / 2,
                    position.y + modifier + borderWidth / 2,
                    size.x - borderWidth,
                    size.y - borderWidth,
                    strokeRadius
                );
            } else {
                ctx.rect(position.x + modifier, position.y + modifier, size.x - borderWidth, size.y - borderWidth);
            }
            ctx.stroke();
        }
    }

    drawCheckbox(
        position: Point,
        checked: boolean,
        color: string,
        backgroundColor: string,
        borderColor: string,
        text: string,
        font?: Font
    ): void {
        this.clear();
        const ctx = this.drawContext.ctx;
        // Use a fixed checkbox square size.
        const boxSize = LVGL_CHECKBOX_BOX_SIZE;
        const boxRadius = Math.max(0, Math.min(LVGL_CHECKBOX_RADIUS, Math.round(boxSize / 2 - 1)));
        // Use the border color for border/fill, text color from the layer.
        const fillColor = checked ? borderColor : backgroundColor;
        const checkColor = backgroundColor;
        // Draw the checkbox background fill.
        if (fillColor) {
            ctx.fillStyle = fillColor;
            ctx.beginPath();
            if (boxRadius > 0) {
                ctx.roundRect(position.x, position.y, boxSize, boxSize, boxRadius);
            } else {
                ctx.rect(position.x, position.y, boxSize, boxSize);
            }
            ctx.fill();
        }
        // Draw the checkbox border.
        if (borderColor) {
            ctx.strokeStyle = borderColor;
            ctx.lineWidth = 2;
            ctx.beginPath();
            if (boxRadius > 0) {
                ctx.roundRect(position.x + 0.5, position.y + 0.5, boxSize - 1, boxSize - 1, boxRadius);
            } else {
                ctx.rect(position.x + 0.5, position.y + 0.5, boxSize - 1, boxSize - 1);
            }
            ctx.stroke();
        }
        // Draw the check mark when enabled using the background color.
        if (checked && checkColor) {
            ctx.strokeStyle = checkColor;
            ctx.lineWidth = Math.max(2, Math.round(boxSize / 6));
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(position.x + boxSize * 0.25, position.y + boxSize * 0.5);
            ctx.lineTo(position.x + boxSize * 0.45, position.y + boxSize * 0.7);
            ctx.lineTo(position.x + boxSize * 0.8, position.y + boxSize * 0.3);
            ctx.stroke();
        }
        // Draw the label to the right of the box.
        if (text && font) {
            this.setColor(color);
            const textX = position.x + boxSize + LVGL_CHECKBOX_TEXT_GAP;
            const textY = position.y + boxSize / 2 + 2;
            font.drawText(this.drawContext, text, new Point(textX, textY), LVGL_CHECKBOX_TEXT_SCALE, 'middle');
        }
    }
}
