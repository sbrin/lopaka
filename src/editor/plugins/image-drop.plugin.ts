import {IconLayer} from '../../core/layers/icon.layer';
import {Point} from '../../core/point';
import {AbstractEditorPlugin} from './abstract-editor.plugin';

export class ImageDropPlugin extends AbstractEditorPlugin {
    onDrop(point: Point, event: DragEvent): void {
        const name = event.dataTransfer.getData('text/plain');
        const url = event.dataTransfer.getData('text/uri');
        this.session.state.layers.forEach((layer) => (layer.selected = false));
        if (event.dataTransfer.files.length > 0) {
            // todo drop from desktop
        } else {
            this.addImageLayer(name, url, point);
        }
    }

    private async addImageLayer(name: string, url: string, point: Point) {
        const {virtualScreen} = this.session;
        this.session.state.layers.forEach((layer) => (layer.selected = false));
        const icon = new Image();
        icon.src = url;
        icon.crossOrigin = 'anonymous';
        icon.dataset.name = name;
        const size = await new Promise<Point>((resolve, reject) => {
            icon.onload = () => {
                resolve(new Point(icon.width, icon.height));
            };
            icon.onerror = reject;
        });
        const newLayer = new IconLayer(this.session.getPlatformFeatures());
        newLayer.name = name;
        newLayer.size = size;
        newLayer.position = point.clone().subtract(size.clone().divide(2));
        newLayer.selected = true;
        newLayer.stopEdit();
        this.session.addLayer(newLayer);
        newLayer.modifiers.icon.setValue(icon);
        virtualScreen.redraw();
    }
}
