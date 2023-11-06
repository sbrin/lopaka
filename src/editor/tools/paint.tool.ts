import {AbstractLayer} from '../../core/layers/abstract.layer';
import {AbstractTool} from './abstract.tool';

export class PaintTool extends AbstractTool {
    name = 'paint';

    createLayer(): AbstractLayer {
        return null;
    }
}
