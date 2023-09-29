/**
 * Abstract platform definition.
 */
export abstract class Platform {
  protected codeHeading: string[];
  protected codeBody: string[];
  protected codeFooter: string[];

  protected fonts: TPlatformFont[];

  abstract generate(): string;

  abstract drawIcon(): string;
  abstract drawText(): string;
  abstract drawLine(): string;
  abstract drawRect(): string;
  abstract drawCircle(): string;
  abstract drawDot(): string;
  abstract drawFrame(): string;
  abstract drawDisc(): string;
  abstract drawBitmap(): string;
}
