import {Layer} from 'src/core/layer';
import {Point} from '../../core/point';
import {BDFFont} from '../fonts/bdf.font';
import {BinaryFont} from '../fonts/binary.font';
import {Font, FontFormat} from '../fonts/font';
import {TTFFont} from '../fonts/ttf.font';
import {Tool, ToolParamType} from './tool';

const loadedFonts: Map<string, Font> = new Map();

export class TextTool extends Tool {
    name = 'string';

    private scaleFactor: number = 1;
    private lastFont: string;

    params = [
        {
            name: 'x',
            type: ToolParamType.number,
            setValue(layer: Layer, value: number) {
                layer.position.x = value;
            },
            getValue(layer: Layer) {
                return layer.position.x;
            }
        },
        {
            name: 'y',
            type: ToolParamType.number,
            setValue(layer: Layer, value: number) {
                layer.position.y = value;
            },
            getValue(layer: Layer) {
                return layer.position.y;
            }
        },
        {
            name: 'font',
            type: ToolParamType.font,
            setValue(layer: Layer, value: string) {
                layer.data.font = value;
                this.lastFont = value;
            },
            getValue(layer: Layer) {
                return layer.data.font;
            }
        },
        {
            name: 'text',
            type: ToolParamType.string,
            setValue(layer: Layer, value: string) {
                layer.data.text = value;
            },
            getValue(layer: Layer) {
                return layer.data.text;
            }
        }
    ];

    async draw(layer: Layer): Promise<void> {
        const {dc, data} = layer;
        dc.clear();
        layer.bounds = await this.getFont(layer).drawText(dc, data.text, layer.position, this.scaleFactor);
        layer.size = layer.bounds.size.clone();
        dc.ctx.save();
        dc.ctx.fillStyle = 'rgba(0,0,0,0)';
        dc.ctx.beginPath();
        dc.ctx.rect(layer.bounds.x, layer.bounds.y, layer.bounds.w, layer.bounds.h);
        dc.ctx.fill();
        dc.ctx.restore();
    }

    edit(layer: Layer, position: Point, originalEvent: MouseEvent): void {
        layer.position = position.clone();
        layer.bounds = this.getBounds(layer);
        this.draw(layer);
    }

    startEdit(layer: Layer, position: Point, originalEvent: MouseEvent): void {
        layer.position = position.clone();
        if (!layer.data.text) {
            layer.data.text = 'String 123';
        }
        if (!layer.data.font) {
            layer.data.font = this.lastFont || this.session.platforms[this.session.state.platform].getFonts()[0].name;
        }
        // get previous font or default for the platform
        this.lastFont = layer.data.font;
        layer.bounds = this.getBounds(layer);
        this.getFont(layer);
        this.draw(layer);
    }

    stopEdit(layer: Layer, position: Point, originalEvent: MouseEvent): void {}

    private getFont(layer: Layer): Font {
        const {data} = layer;
        const {platform} = this.session.state;
        if (!loadedFonts.has(data.font)) {
            let font: Font;
            const fonts = this.session.platforms[platform].getFonts();
            const layerFont = fonts.find((font) => font.name === data.font) || fonts[0];
            switch (layerFont.format) {
                case FontFormat.FORMAT_BDF:
                    font = new BDFFont(layerFont.file, layerFont.name, layerFont.options);
                    break;
                case FontFormat.FORMAT_TTF:
                    font = new TTFFont(layerFont.file, layerFont.name, layerFont.options);
                    break;
                case FontFormat.FORMAT_5x7:
                    font = new BinaryFont(layerFont.file, layerFont.name, layerFont.options);
                    break;
            }
            loadedFonts.set(data.font, font);
        }
        return loadedFonts.get(data.font);
    }
}
