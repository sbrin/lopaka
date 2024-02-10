import {Point} from '../../core/point';
import {DrawContext} from '../draw-context';
import {Font, FontFormat} from './font';

export class TTFFont extends Font {
    constructor(
        protected source: string | File,
        public name: string,
        protected options: TFontSizes
    ) {
        super(source, name, FontFormat.FORMAT_TTF, options);
    }
    // TODO: variable font size
    async loadFont(): Promise<any> {
        if (this.source instanceof File) {
            return this.source.arrayBuffer().then((data) => {
                const font = new FontFace(this.name, new Uint8Array(data));
                font.load();
                return font.loaded;
            });
        }
        const font = new FontFace(this.name, `url(${this.source})`);
        font.load();
        await font.loaded;
        (document.fonts as any).add(font);
    }

    getSize(dc: DrawContext, text: string): Point {
        const {ctx} = dc;
        ctx.save();
        ctx.font = `${this.options.size}px '${this.name}', monospace`;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'alphabetic';
        const measure = ctx.measureText(text);
        ctx.restore();
        return new Point(measure.actualBoundingBoxRight - measure.actualBoundingBoxLeft, this.options.textCharHeight);
    }

    drawText(dc: DrawContext, text: string, position: Point, scaleFactor: number = 1): void {
        const {ctx} = dc;
        ctx.beginPath();
        ctx.font = `${this.options.size}px '${this.name}', monospace`;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'alphabetic';
        ctx.fillText(text, position.x, position.y);
    }
}
