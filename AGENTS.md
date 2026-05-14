— Never test visual canvas or DOM rendering. Only test the logic.
- Never commit or push without permission.

## Specification Rules

- For every new user-facing feature, first write or update a Gherkin spec under `specs/` before implementation.
- If work changes an existing feature rather than adding a new one, update the existing Gherkin spec after implementation.
- Update Gherkin specs only when user-visible behavior changes. Do not add spec churn for internal refactors or bugfixes that do not change expected behavior.
- Keep the `specs/` tree stable and mirrored to `src/` so specs are easy to find from the implementation path.
- Prefer feature-level `.feature` files named by behavior, not by ticket number, bug number, PR number, or one-off fix.
- When behavior belongs to an existing feature, extend the existing `.feature` file instead of creating parallel duplicates.
- The specification should focus on the functionality and properties that are available to the user, framing it as a set of capabilities rather than a list of restrictions or missing elements.

## Build & Development Commands

```bash
pnpm install          # Install dependencies (never use npm)
pnpm build            # Production build (VitePress docs + Vite app)
pnpm test             # Run all tests
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

### UI Components

**Fui** (`src/components/fui/`) - All Core editor UI components.
**FuiTools** (`src/components/fui/FuiTools.vue`) - Tools selection.
**PaintColorModeToggle** (`src/components/fui/PaintBrushColorInput.vue`) - Paint color mode toggle.
**PaintBrushColorInput** (`src/components/fui/PaintColorModeToggle.vue`) - Paint brush color input.
**FuiSelectScale** (`src/components/fui/FuiSelectScale.vue`) - Zoom & Scale.
**FuiLayers** (`src/components/layers/`) - Layers list and management.
**FuiCanvas** (`src/components/fui/FuiCanvas.vue`) - Drawing Canvas.
**Inspector** (`src/components/inspector/`) - Layer properties inspector panel.
**FuiCode** (`src/components/fui/FuiCode.vue`) - Generated code.
**FuiCodeSettings** (`src/components/fui/FuiCodeSettings.vue`) - Code settings.

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
