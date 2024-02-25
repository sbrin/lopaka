import {getFont} from '../../draw/fonts';
import {Font} from '../../draw/fonts/font';
import {TPlatformFeatures} from '../../platforms/platform';
import {mapping} from '../decorators/mapping';
import {Point} from '../point';
import {Rect} from '../rect';
import {AbstractLayer, EditMode, TLayerModifiers, TModifierType} from './abstract.layer';

export class TextLayer extends AbstractLayer {
    protected type: ELayerType = 'string';
    protected editState: {
        firstPoint: Point;
        position: Point;
        text: string;
    } = null;

    public get properties(): any {
        return {
            x: this.position.x,
            y: this.position.y,
            h: this.bounds.h,
            scaleFactor: this.scaleFactor,
            fontSize: this.scaleFactor,
            font: this.font.name,
            text: this.text,
            color: this.color,
            type: this.type,
            id: this.uid,
            inverted: this.inverted
        };
    }

    @mapping('p', 'point') public position: Point = new Point();
    @mapping('d') public text: string = 'Text';
    @mapping('z') public scaleFactor: number = 1;
    @mapping('f', 'font') public font: Font;

    modifiers: TLayerModifiers = {
        x: {
            getValue: () => this.position.x,
            setValue: (v: number) => {
                this.position.x = v;
                this.updateBounds();
                this.draw();
            },
            type: TModifierType.number
        },
        y: {
            getValue: () => this.position.y,
            setValue: (v: number) => {
                this.position.y = v;
                this.updateBounds();
                this.draw();
            },
            type: TModifierType.number
        },
        fontSize: {
            getValue: () => this.scaleFactor,
            setValue: (v: string) => {
                this.scaleFactor = Math.max(parseInt(v), 1);
                this.updateBounds();
                this.draw();
            },
            type: TModifierType.number
        },
        font: {
            getValue: () => this.font?.name,
            setValue: (v: string) => {
                this.font = getFont(v);
                this.updateBounds();
                this.draw();
            },
            type: TModifierType.font
        },
        text: {
            getValue: () => this.text,
            setValue: (v: string) => {
                this.text = v;
                this.updateBounds();
                this.draw();
            },
            type: TModifierType.string
        },
        color: {
            getValue: () => this.color,
            setValue: (v: string) => {
                this.color = v;
                this.updateBounds();
                this.draw();
            },
            type: TModifierType.color
        },
        inverted: {
            getValue: () => this.inverted,
            setValue: (v: boolean) => {
                this.inverted = v;
                this.draw();
            },
            type: TModifierType.boolean
        }
    };

    constructor(
        protected features: TPlatformFeatures,
        font: Font
    ) {
        super(features);
        if (!this.features.hasCustomFontSize) {
            delete this.modifiers.fontSize;
        }
        if (!this.features.hasRGBSupport) {
            delete this.modifiers.color;
        }
        if (!this.features.hasInvertedColors) {
            delete this.modifiers.inverted;
        }
        this.font = font;
        this.color = this.features.defaultColor;
    }

    startEdit(mode: EditMode, point: Point) {
        this.mode = mode;
        if (mode == EditMode.CREATING) {
            this.position = point.clone();
            this.updateBounds();
            this.draw();
        }
        this.editState = {
            firstPoint: point,
            position: this.position.clone(),
            text: this.text
        };
    }

    edit(point: Point, originalEvent: MouseEvent) {
        const {position, text, firstPoint} = this.editState;
        switch (this.mode) {
            case EditMode.MOVING:
                this.position = position.clone().add(point.clone().subtract(firstPoint)).round();
                break;
            case EditMode.RESIZING:
                // this.size = size.clone().add(point.clone().subtract(firstPoint)).round();
                // todo
                break;
            case EditMode.CREATING:
                this.position = point.clone();
                break;
        }
        this.updateBounds();
        this.draw();
    }

    stopEdit() {
        this.mode = EditMode.NONE;
        this.editState = null;
        this.history.push(this.state);
    }

    draw() {
        const {dc, position, text, font, bounds} = this;
        dc.clear();
        dc.ctx.fillStyle = this.color;
        dc.ctx.strokeStyle = this.color;
        font.drawText(dc, text, position.clone(), this.scaleFactor);
        dc.ctx.save();
        dc.ctx.fillStyle = 'rgba(0,0,0,0)';
        dc.ctx.beginPath();
        dc.ctx.rect(bounds.x, bounds.y, bounds.w, bounds.h);
        dc.ctx.fill();
        dc.ctx.restore();
    }

    onLoadState() {
        this.updateBounds();
        this.mode = EditMode.NONE;
    }

    updateBounds(): void {
        const {dc, font, position, text} = this;
        const size = font.getSize(dc, text, this.scaleFactor);
        this.bounds = new Rect(position.clone().subtract(0, size.y), size);
    }
}
