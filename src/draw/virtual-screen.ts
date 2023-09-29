import { Platform } from "src/platforms/platform";
import { TItem, type TLayer } from "./draw-context";
import { Point } from "./rect";

export class VirtualScreen {
  private layers: TLayer[] = [];
  private target: OffscreenCanvas;
  private ctx: OffscreenCanvasRenderingContext2D;

  constructor(private size: Point, private platform: Platform) {
    this.target = new OffscreenCanvas(size.x, size.y);
    this.ctx = this.target.getContext("2d");
  }

  public clear() {
    this.layers = [];
    this.ctx.clearRect(0, 0, this.target.width, this.target.height);
  }

  public redraw() {
    ////
  }
}
