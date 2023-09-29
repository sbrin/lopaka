import { Platform } from "./platform";
import adafruitFont from "../../fonts/adafruit.ttf";

export class Adafruit extends Platform {
  protected fonts: TPlatformFont[] = [
    {
      name: "Adafruit",
      file: adafruitFont,
    },
  ];

  generate(): string {
    return ``;
  }

  drawIcon(): string {
    return ``;
  }

  drawText(): string {
    return ``;
  }

  drawLine(): string {
    return ``;
  }

  drawRect(): string {
    return ``;
  }

  drawCircle(): string {
    return ``;
  }

  drawDot(): string {
    return ``;
  }

  drawFrame(): string {
    return ``;
  }

  drawDisc(): string {
    return ``;
  }

  drawBitmap(): string {
    return ``;
  }
}
