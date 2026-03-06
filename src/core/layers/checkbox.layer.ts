import {TPlatformFeatures} from '../../platforms/platform';
import {mapping} from '../decorators/mapping';
import {Point} from '../point';
import {Rect} from '../rect';
import {AbstractLayer, EditMode, TLayerEditPoint, TLayerModifiers, TModifierType} from './abstract.layer';
import {AbstractDrawingRenderer} from '../../draw/renderers';
import {getFont} from '../../draw/fonts';
import {Font} from '../../draw/fonts/font';
import {
    LVGL_CHECKBOX_BOX_SIZE,
    LVGL_CHECKBOX_TEXT_GAP,
    LVGL_CHECKBOX_TEXT_SCALE,
    LVGL_CHECKBOX_DEFAULT_TEXT_COLOR,
    LVGL_CHECKBOX_DEFAULT_BG_COLOR,
    LVGL_CHECKBOX_DEFAULT_BORDER_COLOR,
} from '../../platforms/lvgl/constants';

export class CheckboxLayer extends AbstractLayer {
    protected type: ELayerType = 'checkbox';
    protected editState: {
        firstPoint: Point;
        position: Point;
        size: Point;
        editPoint: TLayerEditPoint;
    } = null;

    @mapping('p', 'point') public position: Point = new Point();
    @mapping('s', 'point') public size: Point = new Point();
    @mapping('d') public text: string = 'Checkbox';
    @mapping('f', 'font') public font: Font;
    @mapping('ch') public checked: boolean = false;
    // Use LVGL defaults for checkbox background.
    @mapping('bc') public backgroundColor: string = LVGL_CHECKBOX_DEFAULT_BG_COLOR;
    // Use LVGL accent for checkbox border color.
    @mapping('bdc') public borderColor: string = LVGL_CHECKBOX_DEFAULT_BORDER_COLOR;

    constructor(
        protected features: TPlatformFeatures,
        renderer?: AbstractDrawingRenderer,
        font?: Font
    ) {
        super(features, renderer);
        // Apply LVGL-like defaults for checkbox colors and size.
        this.color = LVGL_CHECKBOX_DEFAULT_TEXT_COLOR;
        this.size = new Point(LVGL_CHECKBOX_BOX_SIZE, LVGL_CHECKBOX_BOX_SIZE);
        // Checkbox size is fixed, disable resize interactions.
        this.resizable = false;
        // Prefer the provided font for label rendering.
        if (font) {
            this.font = font;
        }
        // Drop color controls if the platform does not support them.
        if (!this.features?.hasRGBSupport && !this.features?.hasIndexedColors) {
            delete this.modifiers.color;
            delete this.modifiers.backgroundColor;
            delete this.modifiers.borderColor;
        }
    }

    // Expose editable properties for the inspector UI.
    modifiers: TLayerModifiers = {
        x: {
            getValue: () => this.position.x,
            setValue: (v: number) => {
                this.position.x = v;
                this.updateBounds();
                this.draw();
            },
            getVariable: (name: string) => this.variables[name] ?? false,
            setVariable: (name: string, enabled: boolean) => {
                this.variables[name] = enabled;
            },
            type: TModifierType.number,
        },
        y: {
            getValue: () => this.position.y,
            setValue: (v: number) => {
                this.position.y = v;
                this.updateBounds();
                this.draw();
            },
            getVariable: (name: string) => this.variables[name] ?? false,
            setVariable: (name: string, enabled: boolean) => {
                this.variables[name] = enabled;
            },
            type: TModifierType.number,
        },
        text: {
            getValue: () => this.text,
            setValue: (v: string) => {
                this.text = v;
                this.updateBounds();
                this.draw();
            },
            getVariable: (name: string) => this.variables[name] ?? false,
            setVariable: (name: string, enabled: boolean) => {
                this.variables[name] = enabled;
            },
            type: TModifierType.string,
        },
        font: {
            getValue: () => this.font?.name,
            setValue: (v: string) => {
                this.font = getFont(v);
                this.updateBounds();
                this.draw();
            },
            type: TModifierType.font,
        },
        color: {
            getValue: () => this.color,
            setValue: (v: string) => {
                this.color = v;
                this.draw();
            },
            getVariable: (name: string) => this.variables[name] ?? false,
            setVariable: (name: string, enabled: boolean) => {
                this.variables[name] = enabled;
            },
            type: TModifierType.color,
        },
        backgroundColor: {
            getValue: () => this.backgroundColor,
            setValue: (v: string) => {
                this.backgroundColor = v;
                this.draw();
            },
            getVariable: (name: string) => this.variables[name] ?? false,
            setVariable: (name: string, enabled: boolean) => {
                this.variables[name] = enabled;
            },
            type: TModifierType.color,
        },
        borderColor: {
            getValue: () => this.borderColor,
            setValue: (v: string) => {
                this.borderColor = v;
                this.draw();
            },
            getVariable: (name: string) => this.variables[name] ?? false,
            setVariable: (name: string, enabled: boolean) => {
                this.variables[name] = enabled;
            },
            type: TModifierType.color,
        },
        checked: {
            getValue: () => this.checked,
            setValue: (v: boolean) => {
                this.checked = v;
                this.draw();
            },
            getVariable: (name: string) => this.variables[name] ?? false,
            setVariable: (name: string, enabled: boolean) => {
                this.variables[name] = enabled;
            },
            type: TModifierType.boolean,
        },
    };

    startEdit(mode: EditMode, point: Point, editPoint: TLayerEditPoint) {
        this.pushHistory();
        this.mode = mode;
        // Set a default size when creating the checkbox.
        if (mode == EditMode.CREATING) {
            this.position = point.clone();
            this.size = new Point(LVGL_CHECKBOX_BOX_SIZE, LVGL_CHECKBOX_BOX_SIZE);
            this.updateBounds();
            this.draw();
        }
        // Capture the initial edit state for drag/resize.
        this.editState = {
            firstPoint: point,
            editPoint,
            position: this.position.clone(),
            size: this.size.clone(),
        };
    }

    edit(point: Point, originalEvent: MouseEvent | TouchEvent) {
        if (!this.editState) {
            return;
        }
        const {position, editPoint, firstPoint} = this.editState;
        // Apply move/resize behavior based on the current edit mode.
        switch (this.mode) {
            case EditMode.MOVING:
                this.position = position.clone().add(point.clone().subtract(firstPoint)).round();
                break;
            case EditMode.RESIZING:
                // Ignore resize events since checkbox size is fixed.
                editPoint?.move(firstPoint.clone().subtract(point));
                break;
            case EditMode.CREATING:
                break;
        }
        this.updateBounds();
        this.draw();
    }

    stopEdit() {
        // Reset edit bookkeeping when interaction ends.
        this.mode = EditMode.NONE;
        this.editState = null;
    }

    draw() {
        // Delegate checkbox rendering to the active renderer.
        if (this.renderer.drawCheckbox) {
            this.renderer.drawCheckbox(
                this.position,
                this.checked,
                this.color,
                this.backgroundColor,
                this.borderColor,
                this.text,
                this.font
            );
        }
    }

    onLoadState() {
        this.updateBounds();
        this.mode = EditMode.NONE;
    }

    updateBounds(): void {
        const boxSize = this.getBoxSize();
        const textSize = this.font
            ? this.font.getSize(this.dc, this.text, LVGL_CHECKBOX_TEXT_SCALE)
            : new Point(0, 0);
        const minWidth = boxSize + LVGL_CHECKBOX_TEXT_GAP + textSize.x;
        const minHeight = Math.max(boxSize, textSize.y);
        // Keep bounds wide enough to include label text.
        this.bounds = new Rect(
            this.position,
            new Point(Math.max(this.size.x, minWidth), Math.max(this.size.y, minHeight))
        );
    }

    public contains(point: Point): boolean {
        const localPoint = point.clone().subtract(this.position);
        // Treat the full bounds (box + text) as selectable.
        return localPoint.x >= 0 && localPoint.x < this.bounds.w && localPoint.y >= 0 && localPoint.y < this.bounds.h;
    }

    private getBoxSize(): number {
        // Use fixed box size for checkbox rendering.
        return LVGL_CHECKBOX_BOX_SIZE;
    }


    public getIcon() {
        // Use the generic check icon for checkbox layers.
        return 'check';
    }
}
