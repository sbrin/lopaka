export type TLayer = {
  name: string;
  type: string;
  items: TItem[];
};

export type TItem = {
  name: string;
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  font: string;
  text: string;
  bitmap: string;
  radius: number;
  thickness: number;
  fill: boolean;
  dot: boolean;
  zIndex: number;
};

export class DrawContext {
  layers: TLayer[];

  /////
}
