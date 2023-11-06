import {AbstractLayer} from '../../core/layers/abstract.layer';
import {FrameLayer} from '../../core/layers/frame.layer';
import {AbstractTool} from './abstract.tool';

export class FrameTool extends AbstractTool {
    name = 'frame';

    createLayer(): AbstractLayer {
        return new FrameLayer();
    }
}
