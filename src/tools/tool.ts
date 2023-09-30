import {Platform} from 'src/platforms/platform';
import {DotTool} from './dot';
import {BoxTool} from './box';
import {IconTool} from './icon';
import {FrameTool} from './frame';
import {LineTool} from './line';

export abstract class Tool {
    protected name: string;

    getName(): string {
        return this.name;
    }

    abstract draw(ctx: OffscreenCanvasRenderingContext2D, layer: TLayer): void;
    abstract code(layer: TLayer, platform: Platform, code: TSourceCode): void;
}

export const tools: Tool[] = [new DotTool(), new BoxTool(), new IconTool(), new FrameTool(), new LineTool()];
