import {TPlatformFeatures} from '../../platforms/platform';
import {Point} from '../point';
import {AbstractImageLayer, TImageState} from './abstract-image.layer';
import {EditMode, TLayerModifiers, TModifierType} from './abstract.layer';

export class PaintLayer extends AbstractImageLayer {
    protected type: ELayerType = 'paint';

    modifiers: TLayerModifiers = {
        x: {
            getValue: () => this.position.x,
            setValue: (v: number) => {
                this.position.x = v;

                this.updateBounds();
                this.saveState();
                this.draw();
            },
            type: TModifierType.number
        },
        y: {
            getValue: () => this.position.y,
            setValue: (v: number) => {
                this.position.y = v;
                this.updateBounds();
                this.saveState();
                this.draw();
            },
            type: TModifierType.number
        },
        color: {
            getValue: () => this.color,
            setValue: (v: string) => {
                this.color = v;
            },
            type: TModifierType.color
        },
        w: {
            getValue: () => this.size.x,
            type: TModifierType.number
        },
        h: {
            getValue: () => this.size.y,
            type: TModifierType.number
        }
    };

    constructor(protected features: TPlatformFeatures) {
        super(features);
        if (!this.features.hasCustomFontSize) {
            delete this.modifiers.fontSize;
        }
        if (!this.features.hasRGBSupport) {
            delete this.modifiers.color;
        }
        this.color = this.features.defaultColor;
    }

    startEdit(mode: EditMode, point: Point) {
        this.mode = mode;
        this.editState = {
            firstPoint: point,
            position: this.position?.clone() || new Point(),
            size: this.size?.clone() || new Point()
        };
        if (mode === EditMode.CREATING) {
            this.editState.position = point.clone();
        }
    }

    edit(point: Point, originalEvent: MouseEvent) {
        const {position, firstPoint} = this.editState;
        const {ctx} = this.dc;
        switch (this.mode) {
            case EditMode.MOVING:
                const newPos = position.clone().add(point.clone().subtract(firstPoint)).round();
                this.position = newPos.clone();
                break;
            case EditMode.RESIZING:
                // this.size = size.clone().add(point.clone().subtract(firstPoint)).round();
                // todo
                break;
            case EditMode.CREATING:
                if (originalEvent && originalEvent.which == 3) {
                    ctx.save();
                    ctx.beginPath();
                    ctx.rect(point.x, point.y, 1, 1);
                    ctx.fillStyle = this.features.hasInvertedColors ? '#000' : '#fff';
                    ctx.fill();
                    ctx.closePath();
                    ctx.restore();
                } else {
                    ctx.save();
                    ctx.beginPath();
                    if (position.distanceTo(point) < 1) {
                        ctx.rect(point.x, point.y, 1, 1);
                    } else {
                        const diff = point.clone().subtract(position);
                        const steps = Math.max(Math.abs(diff.x), Math.abs(diff.y));
                        const step = diff.clone().divide(steps);
                        for (let i = 0; i < steps; i++) {
                            const p = position.clone().add(step.clone().multiply(i)).round();
                            ctx.rect(p.x, p.y, 1, 1);
                        }
                    }
                    ctx.fillStyle = this.color;
                    ctx.fill();
                    this.editState.position = point.clone();
                    ctx.closePath();
                    ctx.restore();
                }
                this.recalculate();
                break;
        }
        this.updateBounds();
        this.draw();
    }

    recalculate() {
        const {dc} = this;
        const {width, height} = dc.ctx.canvas;
        const data = dc.ctx.getImageData(0, 0, width, height);
        let min: Point = new Point(width, height);
        let max: Point = new Point(0, 0);
        for (let i = 0; i < data.data.length; i += 4) {
            const x = (i / 4) % width;
            const y = Math.floor(i / 4 / width);
            const [r, g, b, a] = data.data.slice(i, i + 4);
            const colorSum = r + g + b;
            let isTransparent = this.features.hasInvertedColors && colorSum == 0;
            if (!isTransparent) {
                min = min.min(new Point(x, y));
                max = max.max(new Point(x, y));
            }
        }
        this.position = min.clone();
        this.size = max.clone().subtract(min).add(1);
        this.data = dc.ctx.getImageData(min.x, min.y, this.size.x, this.size.y);
    }

    stopEdit() {
        this.mode = EditMode.NONE;
        this.updateBounds();
        this.editState = null;
        this.saveState();
    }

    draw() {
        if (this.data) {
            super.draw();
        }
    }

    saveState() {
        if (this.data) {
            super.saveState();
        }
    }

    loadState(state: TImageState) {
        super.loadState(state);
    }
}
