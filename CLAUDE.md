— Never test visual canvas or or DOM rendering. Only test the logic.
- Never commit or push without permission.

## Build & Development Commands

```bash
pnpm install          # Install dependencies (never use npm)
pnpm build            # Production build (VitePress docs + Vite app)
pnpm test             # Run all tests
pnpm test-dev         # Run tests in watch mode
pnpm test -- src/platforms/u8g2.test.ts  # Run single test file
```

## Architecture Overview

Lopaka is a VueJS 3 graphics editor that generates code for embedded graphics libraries (U8g2, AdafruitGFX, TFT_eSPI, LVGL, FlipperZero, etc.).

### Core Systems

**Session** (`src/core/session.ts`) - Central state container using Vue's `reactive()`. Holds:
- `platform` - current target platform
- `display` - screen dimensions
- `layersManager` - manages all drawing layers
- `editor` - orchestrates tools and plugins
- `virtualScreen` - canvas rendering
- `history` - undo/redo stack

**Layer System** (`src/core/layers/`) - Each drawable element (Rectangle, Circle, Text, Paint, etc.) inherits from `AbstractLayer`. Layers use `@mapping()` decorators for state serialization.

**Platform System** (`src/platforms/`) - Each platform (U8g2, TFT_eSPI, LVGL, etc.) extends `Platform` base class and provides:
- Feature flags (`TPlatformFeatures`)
- Code generation via Pug templates (`templates/`)
- Source code parsers for reverse-engineering (`parsers/`)

**Editor** (`src/editor/`) - Uses plugin architecture:
- Tools (`tools/`) - PaintTool, RectTool, TextTool, etc.
- Plugins (`plugins/`) - MovePlugin, ResizePlugin, HistoryPlugin, CopyPlugin, etc.

**Drawing** (`src/draw/`) - Renderers (`PixelatedDrawingRenderer` for pixel-perfect, `SmoothDrawingRenderer` for LVGL), font parsers (BDF, GFX, TTF), canvas plugins.

### Data Flow

1. User interacts with canvas → Editor captures events
2. Active tool/plugin creates or modifies layers
3. Layer state changes trigger `VirtualScreen.redraw()`
4. Each layer renders to OffscreenCanvas
5. Save serializes layers via `@mapping` decorators → Supabase

### Custom Vite Plugins

`vite-plugins/` contains custom loaders:
- `bdf-format` - BDF font files
- `gfx-format` - GFX font files
- `pug-template` - Pug code generation templates
- `icons-pack` - Icon bundling
- `svg-component` - SVG as Vue components

### Testing

Tests are colocated with source files (`*.test.ts`). Platform tests use snapshots for code generation verification. Run `pnpm test -- -u` to update snapshots.

### Key Patterns

- **Decorator-based serialization**: `@mapping('alias', type)` on layer properties
- **Plugin architecture**: Both editor (tools/actions) and canvas (visual overlays)
- **Pug templates**: Code generation templates in `platforms/templates/`
- **OffscreenCanvas**: Non-blocking rendering for performance
