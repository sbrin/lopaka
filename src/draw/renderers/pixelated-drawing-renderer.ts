import {AbstractDrawingRenderer} from './abstract-drawing-renderer';
import {Point} from '../../core/point';
import {Font} from '../fonts/font';
import {
    LVGL_CHECKBOX_BOX_SIZE,
    LVGL_CHECKBOX_TEXT_GAP,
    LVGL_CHECKBOX_TEXT_SCALE,
    LVGL_CHECKBOX_RADIUS,
} from '../../platforms/lvgl/constants';

/**
 * Default pixelated drawing renderer that implements the current pixelated drawing approach
 * This maintains backward compatibility with existing platforms
 */
export class PixelatedDrawingRenderer extends AbstractDrawingRenderer {
    clear(): void {
        this.drawContext.clear();
    }

    drawRect(position: Point, size: Point, fill: boolean, color: string): void {
        this.clear();
        this.setColor(color);
        this.drawContext.rect(position, size, fill);
    }

    drawRoundedRect(position: Point, size: Point, radius: number, fill: boolean, color: string): void {
        this.clear();
        this.setColor(color);
        this.drawContext.pixelateRoundedRect(position, size, radius, fill);
    }

    drawCircle(center: Point, radius: number, fill: boolean, color: string): void {
        this.clear();
        this.setColor(color);
        this.drawContext.pixelateCircle(center, radius, fill);
    }

    drawEllipse(center: Point, radiusX: number, radiusY: number, fill: boolean, color: string): void {
        this.clear();
        this.setColor(color);
        this.drawContext.pixelateEllipse(center, radiusX, radiusY, fill);
    }

    drawLine(from: Point, to: Point, color: string): void {
        this.clear();
        this.setColor(color);
        this.drawContext.pixelateLine(from, to, 1);
    }

    drawTriangle(p1: Point, p2: Point, p3: Point, fill: boolean, color: string): void {
        this.clear();
        this.setColor(color);
        if (fill) {
            this.drawContext.pixelateFilledTriangle(p1, p2, p3);
        } else {
            this.drawContext.pixelateLine(p1, p2, 1);
            this.drawContext.pixelateLine(p2, p3, 1);
            this.drawContext.pixelateLine(p3, p1, 1);
        }
    }

    drawPolygon(points: Point[], fill: boolean, color: string): void {
        this.clear();
        this.setColor(color);
        this.drawContext.pixelatePolygon(points, fill);
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
        // this.clear();
        // // Draw button background using pixelated rounded rect
        // this.setColor(backgroundColor);
        // this.drawContext.pixelateRoundedRect(position, size, radius, true);

        // // Draw text if provided
        // if (text && font) {
        //     this.setColor(textColor);

        //     // Calculate centered text position
        //     const textSize = font.getSize(this.drawContext, text, 14);
        //     const textX = position.x + (size.x - textSize.x) / 2;
        //     const textY = position.y + size.y / 2;

        //     font.drawText(this.drawContext, text, new Point(textX, textY), 14, 'middle');
        // }
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

        // Draw background (filled pixelated rounded rectangle)
        if (backgroundColor) {
            this.setColor(backgroundColor);
            if (radius > 0) {
                this.drawContext.pixelateRoundedRect(position, size, radius, true);
            } else {
                this.drawContext.rect(position, size, true);
            }
        }

        // Draw border (stroked pixelated rounded rectangle)
        if (borderWidth > 0 && borderColor) {
            this.setColor(borderColor);
            // For pixelated renderer, we draw the border as an outline
            if (radius > 0) {
                this.drawContext.pixelateRoundedRect(position, size, radius, false);
            } else {
                this.drawContext.rect(position, size, false);
            }
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
        // Determine the square size for the checkbox box.
        const boxSize = LVGL_CHECKBOX_BOX_SIZE;
        const boxRadius = Math.max(0, Math.min(LVGL_CHECKBOX_RADIUS, Math.round(boxSize / 2 - 1)));
        const boxSizePoint = new Point(boxSize);
        // Use the border color for border/fill, text color from the layer.
        const fillColor = checked ? borderColor : backgroundColor;
        const checkColor = backgroundColor;
        // Draw the checkbox background.
        if (fillColor) {
            this.setColor(fillColor);
            if (boxRadius > 0) {
                this.drawContext.pixelateRoundedRect(position, boxSizePoint, boxRadius, true);
            } else {
                this.drawContext.rect(position, boxSizePoint, true);
            }
        }
        // Draw the checkbox border.
        if (borderColor) {
            this.setColor(borderColor);
            if (boxRadius > 0) {
                this.drawContext.pixelateRoundedRect(position, boxSizePoint, boxRadius, false);
            } else {
                this.drawContext.rect(position, boxSizePoint, false);
            }
        }
        // Draw the check mark when enabled using the background color.
        if (checked && checkColor) {
            this.setColor(checkColor);
            const start = new Point(position.x + boxSize * 0.25, position.y + boxSize * 0.55).round();
            const mid = new Point(position.x + boxSize * 0.45, position.y + boxSize * 0.75).round();
            const end = new Point(position.x + boxSize * 0.75, position.y + boxSize * 0.3).round();
            this.drawContext.pixelateLine(start, mid, 1);
            this.drawContext.pixelateLine(mid, end, 1);
        }
        // Draw the label next to the checkbox.
        if (text && font) {
            this.setColor(color);
            const textX = position.x + boxSize + LVGL_CHECKBOX_TEXT_GAP;
            const textY = position.y + Math.floor(boxSize / 2);
            font.drawText(this.drawContext, text, new Point(textX, textY), LVGL_CHECKBOX_TEXT_SCALE, 'middle');
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
        this.setColor(checked ? color : backgroundColor);
        const radius = Math.min(size.x, size.y) / 2;
        this.drawContext.pixelateRoundedRect(position, size, radius, true);
        
        // Knob
        const knobPadding = 2;
        const knobDiameter = Math.min(size.x, size.y) - (knobPadding * 2);
        
        if (knobDiameter <= 0) return;

        let knobX, knobY;
        const isVertical = size.y > size.x;

        if (isVertical) {
            // Vertical orientation
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
                knobX = position.x + size.x - knobDiameter - knobPadding;
            } else {
                knobX = position.x + knobPadding;
            }
            knobY = position.y + (size.y - knobDiameter) / 2;
        }
        
        this.setColor('#FFFFFF');
        this.drawContext.pixelateCircle(new Point(knobX + knobDiameter / 2, knobY + knobDiameter / 2), knobDiameter / 2, true);
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

        // Draw the track background with transparency.
        ctx.save();
        ctx.globalAlpha = 0.3;
        this.setColor(color);
        this.drawContext.pixelateRoundedRect(position, size, trackRadius, true);
        ctx.restore();

        // Draw the filled portion of the track (active part).
        // Keep filled thickness readable on very thin tracks.
        const minFillThickness = 5;
        if (isVertical) {
            // Fill from bottom to top for vertical sliders.
            const fillHeight = (value / 100) * trackHeight;
            if (fillHeight > 0) {
                // Expand the filled thickness without changing the track size.
                const fillWidth = Math.max(minFillThickness, trackWidth);
                const fillX = position.x + (trackWidth - fillWidth) / 2;
                this.setColor(color);
                this.drawContext.pixelateRoundedRect(
                    new Point(fillX, position.y + trackHeight - fillHeight),
                    new Point(fillWidth, fillHeight),
                    trackRadius,
                    true
                );
            }
        } else {
            // Fill from left to right for horizontal sliders.
            const fillWidth = (value / 100) * trackWidth;
            if (fillWidth > 0) {
                // Expand the filled thickness without changing the track size.
                const fillHeight = Math.max(minFillThickness, trackHeight);
                const fillY = position.y + (trackHeight - fillHeight) / 2;
                this.setColor(color);
                this.drawContext.pixelateRoundedRect(
                    new Point(position.x, fillY),
                    new Point(fillWidth, fillHeight),
                    trackRadius,
                    true
                );
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
        this.setColor(color);
        this.drawContext.pixelateCircle(new Point(knobX + knobRadius, knobY + knobRadius), knobRadius, true);
    }
}
