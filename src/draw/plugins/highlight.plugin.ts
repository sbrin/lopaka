import {Point} from '../../core/point';
import {DrawPlugin} from './draw.plugin';

export class HighlightPlugin extends DrawPlugin {
    public update(ctx: CanvasRenderingContext2D, point: Point): void {
        if (this.session.editor.state.activeTool) return;
        const {layersManager} = this.session;
        const {scale} = this.session.state;
        const {interfaceColors} = this.session.getPlatformFeatures();
        ctx.save();
        ctx.beginPath();
        const groups: Set<string> = new Set();
        layersManager.eachLayer((layer) => {
            const bounds = layer.bounds.clone().multiply(scale).round().add(-0.5, -0.5, 1, 1);
            if (layer.selected) {
                if (layer.group) {
                    groups.add(layer.group);
                } else {
                    ctx.save();
                    ctx.strokeStyle = interfaceColors.selectColor;
                    ctx.lineWidth = 1;
                    ctx.setLineDash([5, 5]);
                    ctx.strokeRect(bounds.x, bounds.y, bounds.w, bounds.h);
                    ctx.restore();
                }
            }
        });
        groups.forEach((group) => {
            const groupBounds = layersManager.getGroupBounds(group).multiply(scale).round().add(-0.5, -0.5, 1, 1);
            ctx.save();
            ctx.strokeStyle = interfaceColors.hoverColor;
            ctx.lineWidth = 1;
            ctx.setLineDash([5, 10]);
            ctx.strokeRect(groupBounds.x, groupBounds.y, groupBounds.w, groupBounds.h);
            ctx.restore();
        });
        if (point) {
            const hovered = layersManager.sorted
                .filter((l) => l.contains(point.clone().divide(scale).round()))
                .reverse();
            if (hovered.length) {
                const upperLayer = hovered[0];
                if (!upperLayer.selected || upperLayer.group) {
                    if (upperLayer.group) {
                        const groupBounds = layersManager
                            .getGroupBounds(upperLayer.group)
                            .multiply(scale)
                            .round()
                            .add(-0.5, -0.5, 1, 1);
                        ctx.save();
                        ctx.strokeStyle = interfaceColors.hoverColor;
                        ctx.lineWidth = 1;
                        ctx.setLineDash([5, 10]);
                        ctx.strokeRect(groupBounds.x, groupBounds.y, groupBounds.w, groupBounds.h);
                        ctx.restore();
                    }
                    // else {
                    const bounds = upperLayer.bounds.clone().multiply(scale).round().add(-0.5, -0.5, 1, 1);
                    ctx.save();
                    ctx.strokeStyle = interfaceColors.hoverColor;
                    ctx.lineWidth = 1;
                    if (upperLayer.group) {
                        ctx.setLineDash([5, 5]);
                    }
                    ctx.strokeRect(bounds.x, bounds.y, bounds.w, bounds.h);
                    ctx.restore();
                    // }
                }
            }
        }
        ctx.strokeStyle = interfaceColors.selectColor;
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.restore();
    }
}
