import {Platform} from '../platforms/platform';
import {DotTool} from './dot';
import {BoxTool} from './box';
import {IconTool} from './icon';
import {FrameTool} from './frame';
import {LineTool} from './line';
import {TextTool} from './text';
import {BitmapTool} from './bitmap';
import {CircleTool} from './circle';
import {DiscTool} from './disc';

export abstract class Tool {
    protected name: string;

    getName(): string {
        return this.name;
    }

    abstract draw(ctx: OffscreenCanvasRenderingContext2D, layer: TLayer): void;
    abstract code(layer: TLayer, platform: Platform, code: TSourceCode): void;
}

export const tools: Tool[] = [
    new DotTool(),
    new BoxTool(),
    new IconTool(),
    new FrameTool(),
    new LineTool(),
    new TextTool(),
    new BitmapTool(),
    new CircleTool(),
    new DiscTool()
];
