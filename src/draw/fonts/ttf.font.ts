import {Point} from '../../core/point';
import {Rect} from '../../core/rect';
import {DrawContext} from '../draw-context';
import {Font, FontFormat} from './font';

export class TTFFont extends Font {
    constructor(
        protected url: string,
        public name: string,
        protected options: TFontSizes
    ) {
        super(url, name, options, FontFormat.FORMAT_TTF);
    }
    // TODO: variable font size
    async loadFont(): Promise<void> {
        const font = new FontFace(this.name, `url(${this.url})`);
        await font.load();
    }

    async drawText(dc: DrawContext, text: string, position: Point, scaleFactor: number = 1): Promise<Rect> {
        await this.fontReady;
        const {ctx} = dc;
        ctx.beginPath();
        ctx.font = `${this.options.size}px '${this.name}'`;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText(text, position.x, position.y);
        return new Rect(
            position.clone(),
            new Point(this.options.textCharWidth * text.length, this.options.textCharHeight).multiply(scaleFactor)
        );
    }
}
