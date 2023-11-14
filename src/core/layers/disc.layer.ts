import {CircleLayer} from './circle.layer';

export class DiscLayer extends CircleLayer {
    protected type: ELayerType = 'disc';
    protected fill: boolean = true;
}
