import {Point} from '../../core/point';
import {DrawContext} from '../draw-context';
import {Font, FontFormat} from './font';

export class TTFFont extends Font {
    constructor(
        protected source: TFontSource,
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
                (document.fonts as any).add(font);
                return font.loaded;
            });
        } else if (this.source instanceof Function) {
            return this.source().then((data) => {
                const font = new FontFace(this.name, `url(${data.default})`);
                font.load();
                (document.fonts as any).add(font);
                return font.loaded;
            });
        }
    }

    getSize(dc: DrawContext, text: string, scaleFactor: number = 14): Point {
        const {ctx} = dc;
        ctx.save();
        ctx.font = `${scaleFactor}px '${this.name}'`;
        ctx.letterSpacing = `${scaleFactor / 26}px`;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'alphabetic';
        const measure = ctx.measureText(text);
        ctx.restore();

        return new Point(
            measure.actualBoundingBoxRight - measure.actualBoundingBoxLeft,
            measure.fontBoundingBoxAscent + measure.fontBoundingBoxDescent
        );
    }

    drawText(
        dc: DrawContext,
        text: string,
        position: Point,
        scaleFactor: number = 14,
        baseline: CanvasTextBaseline = 'bottom'
    ): void {
        dc.text(new Point(position.x, position.y - 2), text, `${scaleFactor}px '${this.name}'`, baseline, scaleFactor/50);
    }
}
