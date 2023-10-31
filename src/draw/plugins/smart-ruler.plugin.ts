import {VirtualScreenPlugin} from './virtual-screen.plugin';

export class SmartRulerPlugin extends VirtualScreenPlugin {
    public update(ctx: CanvasRenderingContext2D): void {
        const {activeLayer, layers, scale} = this.session.state;
        // show distance to left and top
        ctx.save();
        ctx.beginPath();
        if (activeLayer && !activeLayer.isStub()) {
            const p1 = activeLayer.bounds.pos.clone().multiply(scale);
            const p2 = activeLayer.bounds.size.clone().multiply(scale).add(p1);
            // horizontal line p1
            ctx.moveTo(0, p1.y);
            ctx.lineTo(p1.x, p1.y);
            ctx.textBaseline = 'bottom';
            ctx.fillText(`${activeLayer.position.y}`, 0, p1.y - 2);
            // vertical line p1
            ctx.moveTo(p1.x, 0);
            ctx.lineTo(p1.x, p1.y);
            ctx.textBaseline = 'top';
            ctx.fillText(`${activeLayer.position.x}`, p1.x + 2, 0);
            if (Math.abs(p1.distanceTo(p2)) > 40) {
                // horizontal line p2
                ctx.moveTo(0, p2.y);
                ctx.lineTo(p2.x, p2.y);
                ctx.textBaseline = 'bottom';
                ctx.fillText(`${activeLayer.size.y + activeLayer.position.y}`, 0, p2.y - 2);

                // vertical line p2
                ctx.moveTo(p2.x, 0);
                ctx.lineTo(p2.x, p2.y);
                ctx.textBaseline = 'top';
                ctx.fillText(`${activeLayer.size.x + activeLayer.position.x}`, p2.x + 2, 0);
            }

            // show distance to closest layer
            // if (activeLayer.edititng) {
            // const sorted = layers
            //     .filter((l) => l != activeLayer)
            //     .reduce((d, l) => {
            //         d.push({poin});
            //     }, []);
            // if (sorted.length > 1) {
            //     const layer = sorted[1];
            //     const layerPos = layer.position.clone().multiply(scale);
            //     ctx.moveTo(p1.x, p1.y);
            //     ctx.lineTo(layerPos.x, p1.y);
            // }
            // }
        }
        ctx.strokeStyle = '#000';
        ctx.setLineDash([2, 4]);
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.restore();
    }
}
