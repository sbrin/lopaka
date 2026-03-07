import {TPlatformFeatures} from '../../platforms/platform';
import {mapping} from '../decorators/mapping';
import {Point} from '../point';
import {Rect} from '../rect';
import {PanelLayer} from './panel.layer';
import {TLayerModifiers, TModifierType} from './abstract.layer';
import {AbstractDrawingRenderer} from '../../draw/renderers';
import {Font, FontFormat} from '../../draw/fonts/font';
import {getFont} from '../../draw/fonts';

// Keep text inset away from the panel border with separate axes.
const TEXT_AREA_PADDING_X = 12;
const TEXT_AREA_PADDING_Y = 12;

export class TextAreaLayer extends PanelLayer {
    protected type: ELayerType = 'textarea';

    @mapping('d') public text: string = 'Text Area';
    @mapping('f', 'font') public font: Font;
    @mapping('z') public scaleFactor: number = 1;
    @mapping('c') public color: string = '#000000';

    constructor(
        protected features: TPlatformFeatures,
        renderer?: AbstractDrawingRenderer,
        font?: Font
    ) {
        super(features, renderer);

        // Merge text-specific modifiers with panel modifiers.
        this.modifiers = {
            ...this.modifiers,
            color: {
                getValue: () => this.color,
                setValue: (v: string) => {
                    this.color = v;
                    this.draw();
                },
                getVariable: (name: string) => this.variables[name] ?? false,
                setVariable: (name: string, enabled: boolean) => {
                    this.variables[name] = enabled;
                },
                type: TModifierType.color,
            },
            text: {
                getValue: () => this.text,
                setValue: (v: string) => {
                    this.text = v;
                    this.draw();
                },
                getVariable: (name: string) => this.variables[name] ?? false,
                setVariable: (name: string, enabled: boolean) => {
                    this.variables[name] = enabled;
                },
                type: TModifierType.string,
            },
            font: {
                getValue: () => this.font?.name,
                setValue: (v: string) => {
                    this.font = getFont(v);
                    this.draw();
                },
                type: TModifierType.font,
            },
            fontSize: {
                getValue: () => this.scaleFactor,
                setValue: (v: string) => {
                    this.scaleFactor = Math.max(parseInt(v), 1);
                    this.draw();
                },
                type: TModifierType.number,
                fixed: true,
            },
        } as TLayerModifiers;

        // Remove font size controls for platforms without scaling.
        if (!this.features.hasCustomFontSize) {
            delete this.modifiers.fontSize;
        }
        // Remove text color controls for monochrome-only platforms.
        if (!this.features.hasRGBSupport && !this.features.hasIndexedColors) {
            delete this.modifiers.color;
        }

        // Initialize font settings from the provided font.
        this.scaleFactor = font?.format == FontFormat.FORMAT_TTF ? 14 : 1;
        if (font) {
            this.font = font;
        }
        // Default text color follows the platform default.
        this.color = this.features.defaultColor;
    }

    // Compute the text width using the active font.
    private getTextWidth(text: string): number {
        return this.font ? this.font.getSize(this.dc, text, this.scaleFactor).x : 0;
    }

    // Determine the line height based on the current font.
    private getLineHeight(): number {
        return this.scaleFactor * 1.15;
    }

    // Compute padding offsets that include the border width.
    private getTextInsets(): Point {
        // Guard against negative border widths in case of custom layer edits.
        const borderInset = Math.max(this.borderWidth, 0);
        return new Point(TEXT_AREA_PADDING_X + borderInset, TEXT_AREA_PADDING_Y + borderInset);
    }

    // Split a hyphenated word into wrap-friendly chunks.
    private splitHyphenatedWord(word: string, maxWidth: number): string[] | null {
        // Skip processing when there is no hyphen to split on.
        if (!word.includes('-')) {
            return null;
        }
        // Build segments that keep hyphens on the previous line.
        const parts = word.split('-');
        const segments = parts.map((part, index) => (index < parts.length - 1 ? `${part}-` : part));
        const lines: string[] = [];
        let currentLine = '';
        for (const segment of segments) {
            // Try to append the segment to the current line.
            const candidate = currentLine ? `${currentLine}${segment}` : segment;
            if (this.getTextWidth(candidate) <= maxWidth) {
                currentLine = candidate;
                continue;
            }
            // Flush the current line when the candidate overflows.
            if (currentLine) {
                lines.push(currentLine);
                currentLine = '';
            }
            // Place the segment on its own line when it fits.
            if (this.getTextWidth(segment) <= maxWidth) {
                currentLine = segment;
                continue;
            }
            // Split an oversized segment into smaller chunks.
            const chunks = this.splitLongWord(segment, maxWidth);
            lines.push(...chunks.slice(0, -1));
            currentLine = chunks[chunks.length - 1] ?? '';
        }
        // Emit the trailing line when present.
        if (currentLine) {
            lines.push(currentLine);
        }
        return lines.length ? lines : null;
    }

    // Split a long word into chunks that fit within the wrap width.
    private splitLongWord(word: string, maxWidth: number): string[] {
        const chunks: string[] = [];
        let buffer = '';
        for (const char of word) {
            const candidate = `${buffer}${char}`;
            if (this.getTextWidth(candidate) > maxWidth && buffer) {
                chunks.push(buffer);
                buffer = char;
            } else {
                buffer = candidate;
            }
        }
        if (buffer) {
            chunks.push(buffer);
        }
        return chunks;
    }

    // Build a wrapped line list for the current text content.
    public getWrappedLines(): string[] {
        // Account for the inner border edge when computing wrap width.
        const insets = this.getTextInsets();
        const maxWidth = Math.max(this.size.x - insets.x * 2, 0);
        // Fallback to a single line when width or font data is unavailable.
        if (!this.font || maxWidth <= 0) {
            return [this.text];
        }
        const paragraphs = this.text.split('\n');
        const lines: string[] = [];
        for (const paragraph of paragraphs) {
            if (!paragraph) {
                lines.push('');
                continue;
            }
            const words = paragraph.split(/\s+/);
            let currentLine = '';
            for (const word of words) {
                if (!word) {
                    continue;
                }
                const candidate = currentLine ? `${currentLine} ${word}` : word;
                if (this.getTextWidth(candidate) <= maxWidth) {
                    currentLine = candidate;
                    continue;
                }
                if (this.getTextWidth(word) > maxWidth) {
                    if (currentLine) {
                        lines.push(currentLine);
                        currentLine = '';
                    }
                    // Prefer wrapping at hyphens before hard splitting.
                    const hyphenLines = this.splitHyphenatedWord(word, maxWidth);
                    if (hyphenLines && hyphenLines.length) {
                        lines.push(...hyphenLines.slice(0, -1));
                        currentLine = hyphenLines[hyphenLines.length - 1] ?? '';
                        continue;
                    }
                    // Fall back to splitting the word by character width.
                    const chunks = this.splitLongWord(word, maxWidth);
                    lines.push(...chunks.slice(0, -1));
                    currentLine = chunks[chunks.length - 1] ?? '';
                    continue;
                }
                if (currentLine) {
                    lines.push(currentLine);
                }
                currentLine = word;
            }
            if (currentLine) {
                lines.push(currentLine);
            }
        }
        return lines.length ? lines : [''];
    }

    draw() {
        // Draw the panel background and border first.
        this.renderer.drawPanel(
            this.position,
            this.size,
            this.radius,
            this.backgroundColor,
            this.borderColor,
            this.borderWidth
        );

        // Skip text rendering when font data is missing.
        if (!this.font) {
            return;
        }

        const ctx = this.renderer.dc.ctx;
        const lineHeight = this.getLineHeight();
        // Account for the inner border edge when computing available height.
        const insets = this.getTextInsets();
        const innerHeight = Math.max(this.size.y - insets.y * 2, 0);
        const maxLines = lineHeight > 0 ? Math.floor(innerHeight / lineHeight) : 0;
        const lines = this.getWrappedLines().slice(0, Math.max(maxLines, 0));

        // Clip text to the inner panel area.
        ctx.save();
        ctx.beginPath();
        ctx.rect(
            this.position.x + insets.x,
            this.position.y + insets.y,
            this.size.x - insets.x * 2,
            innerHeight
        );
        ctx.clip();
        ctx.fillStyle = this.color;

        // Draw each wrapped line using the font renderer.
        lines.forEach((line, index) => {
            const textPosition = new Point(
                this.position.x + insets.x,
                this.position.y + insets.y + lineHeight * (index + 1)
            );
            this.font.drawText(this.renderer.dc, line, textPosition, this.scaleFactor);
        });
        ctx.restore();

        // Draw a transparent overlay for selection hit testing.
        ctx.save();
        ctx.fillStyle = 'rgba(0,0,0,0)';
        ctx.beginPath();
        ctx.rect(this.bounds.x, this.bounds.y, this.bounds.w, this.bounds.h);
        ctx.fill();
        ctx.restore();
    }

    updateBounds(): void {
        // Keep bounds aligned to the panel rectangle.
        this.bounds = new Rect(this.position, this.size);
    }

    protected createCloneInstance(): this {
        // Preserve font settings when cloning text area layers while creating a new renderer instance.
        const RendererCtor = this.renderer.constructor as new () => AbstractDrawingRenderer;
        const renderer = new RendererCtor();
        return new TextAreaLayer(this.features, renderer, this.font) as this;
    }

    getIcon() {
        return 'string';
    }
}
