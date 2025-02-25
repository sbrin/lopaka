import {Point} from '../../core/point';
import {AbstractEditorPlugin} from './abstract-editor.plugin';
import {PaintLayer} from '/src/core/layers/paint.layer';

export class ImageDropPlugin extends AbstractEditorPlugin {
    async onDrop(point: Point, event: DragEvent): Promise<void> {
        this.session.state.layers.forEach((layer) => (layer.selected = false));
        if (event.dataTransfer.files.length > 0) {
            let i = 0;

            for (const file of Array.from(event.dataTransfer.files)) {
                if (file.type.startsWith('image/')) {
                    const url = URL.createObjectURL(file);
                    const name = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
                    const newPoint = point.clone().add(i * 4);
                    this.addImageLayer(name, url, newPoint);
                    i++;
                }
            }
        } else {
            const name = event.dataTransfer.getData('text/plain');
            const url = event.dataTransfer.getData('text/uri');
            this.addImageLayer(name, url, point);
        }
    }

    private async addImageLayer(name: string, url: string, point: Point) {
        const {virtualScreen} = this.session;
        this.session.state.layers.forEach((layer) => (layer.selected = false));
        const icon = new Image();
        icon.crossOrigin = 'anonymous';
        icon.src = url;
        icon.dataset.name = name;
        const size = await new Promise<Point>((resolve, reject) => {
            icon.onload = () => {
                resolve(new Point(icon.width, icon.height));
            };
            icon.onerror = reject;
        });
        const newLayer = new PaintLayer(this.session.getPlatformFeatures());
        newLayer.name = name;
        newLayer.size = size;
        newLayer.position = point.clone().subtract(size.clone().divide(2));
        newLayer.selected = true;
        newLayer.modifiers.icon.setValue(icon);
        newLayer.stopEdit();
        this.session.addLayer(newLayer);
        virtualScreen.redraw();
        this.session.editor.setTool(null);
    }
}
