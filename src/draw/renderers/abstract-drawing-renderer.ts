import {DrawContext} from '../draw-context';
import {Point} from '../../core/point';
import {Font} from '../fonts/font';

/**
 * Abstract drawing renderer interface for platform-specific drawing implementations
 */
export abstract class AbstractDrawingRenderer {
    protected drawContext: DrawContext;

    public setDrawContext(dc: DrawContext) {
        this.drawContext = dc;
    }

    public get dc(): DrawContext {
        return this.drawContext;
    }

    /**
     * Clear the drawing context
     */
    abstract clear(): void;

    /**
     * Draw or fill a rectangle
     * @param position - Top-left position
     * @param size - Width and height
     * @param fill - Whether to fill the rectangle
     * @param color - Color to use
     */
    abstract drawRect(position: Point, size: Point, fill: boolean, color: string): void;

    /**
     * Draw or fill a rounded rectangle
     * @param position - Top-left position
     * @param size - Width and height
     * @param radius - Corner radius
     * @param fill - Whether to fill the rectangle
     * @param color - Color to use
     */
    abstract drawRoundedRect(position: Point, size: Point, radius: number, fill: boolean, color: string): void;

    /**
     * Draw or fill a circle
     * @param center - Center position
     * @param radius - Radius
     * @param fill - Whether to fill the circle
     * @param color - Color to use
     */
    abstract drawCircle(center: Point, radius: number, fill: boolean, color: string): void;

    /**
     * Draw or fill an ellipse
     * @param center - Center position
     * @param radiusX - Horizontal radius
     * @param radiusY - Vertical radius
     * @param fill - Whether to fill the ellipse
     * @param color - Color to use
     */
    abstract drawEllipse(center: Point, radiusX: number, radiusY: number, fill: boolean, color: string): void;

    /**
     * Draw a line between two points
     * @param from - Start point
     * @param to - End point
     * @param color - Color to use
     */
    abstract drawLine(from: Point, to: Point, color: string): void;

    /**
     * Draw or fill a triangle
     * @param p1 - First vertex
     * @param p2 - Second vertex
     * @param p3 - Third vertex
     * @param fill - Whether to fill the triangle
     * @param color - Color to use
     */
    abstract drawTriangle(p1: Point, p2: Point, p3: Point, fill: boolean, color: string): void;

    /**
     * Draw image data at position
     * @param imageData - Image data to draw
     * @param position - Position to draw at
     */
    abstract drawImage(imageData: ImageData, position: Point): void;

    /**
     * Draw a button with background and text
     * @param position - Top-left position
     * @param size - Width and height
     * @param radius - Corner radius
     * @param backgroundColor - Background color
     * @param text - Button text
     * @param textColor - Text color
     * @param font - Font to use for text
     */
    abstract drawButton(
        position: Point,
        size: Point,
        radius: number,
        backgroundColor: string,
        text: string,
        textColor: string,
        font?: Font
    ): void;

    /**
     * Draw text at position
     * @param position - Position to draw text
     * @param text - Text to draw
     * @param font - Font to use
     * @param scaleFactor - Scale factor for the text
     * @param color - Text color
     */
    abstract drawText(position: Point, text: string, font: Font, scaleFactor: number, color: string): void;

    /**
     * Draw a panel with background and border
     * @param position - Top-left position
     * @param size - Width and height
     * @param radius - Corner radius
     * @param backgroundColor - Background color
     * @param borderColor - Border color
     * @param borderWidth - Border width
     */
    abstract drawPanel(
        position: Point,
        size: Point,
        radius: number,
        backgroundColor: string,
        borderColor: string,
        borderWidth: number
    ): void;

    /**
     * Draw a switch
     * @param position - Top-left position
     * @param size - Width and height
     * @param checked - Whether the switch is checked
     * @param color - Active color
     * @param backgroundColor - Inactive color/background
     */
    abstract drawSwitch(
        position: Point,
        size: Point,
        checked: boolean,
        color: string,
        backgroundColor: string
    ): void;

    /**
     * Draw a slider
     * @param position - Top-left position
     * @param size - Width and height
     * @param value - Slider value (0-100)
     * @param color - Active/knob color
     * @param backgroundColor - Track background color
     */
    abstract drawSlider(
        position: Point,
        size: Point,
        value: number,
        color: string
    ): void;

    /**
     * Draw a checkbox with a rounded box and label
     * @param position - Top-left position
     * @param checked - Whether the checkbox is checked
     * @param color - Text color for the checkbox label
     * @param backgroundColor - Box background color
     * @param borderColor - Box border and checked fill color
     * @param text - Label text
     * @param font - Font to use for label text
     */
    abstract drawCheckbox(
        position: Point,
        checked: boolean,
        color: string,
        backgroundColor: string,
        borderColor: string,
        text: string,
        font?: Font
    ): void;

    /**
     * Set the rendering color and style
     * @param color - Color to set
     */
    protected setColor(color: string): void {
        this.drawContext.ctx.fillStyle = color;
        this.drawContext.ctx.strokeStyle = color;
    }
}
