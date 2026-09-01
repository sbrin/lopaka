# WebMCP specifications

These specs describe how a WebMCP-capable browser agent reads and edits a Lopaka screen: what it can discover, what it
may change, and what stays a direct user action.

## Editor model these specs assume

- The active editor screen is persisted in `localStorage` per platform.
- Assets are the bundled icon packs plus images imported in the current session.
- Layer types are the ones implemented in `src/core/layers`.
- Undo, redo, cut, duplicate, paste, image import, and clearing the screen stay user actions; the agent works through
  structured tools instead.

## Features

| Spec                              | Covers                                                                                                                                           |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `editor-access-lifecycle.feature` | Tool discovery, the editor context identifier, stale context and structure rejection, the shared result envelope, and untrusted content marking. |
| `editor-read-model.feature`       | Screen summary, selection, layer list and layer detail, editor messages, generated code, and the canvas PNG.                                     |
| `screen-setup.feature`            | Platform selection, preset and custom display sizes, background color, and local persistence of those settings.                                  |
| `layer-creation.feature`          | Creating each supported layer type through one structured contract, including defaults, geometry rules, and rejection cases.                     |
| `layer-editing.feature`           | Reading editable properties, updating one or several properties, renaming, fonts, deletion, and locked-layer protection.                         |
| `layer-organization.feature`      | Selection, visibility and lock state, stacking order, grouping, and ungrouping.                                                                  |
| `asset-library.feature`           | Searching, previewing, and placing icons and imported images.                                                                                    |

## Conventions

- Layers are addressed by the `layerId` returned from the layer list.
- Structural changes require the current layer structure token and return the next one.
- Errors use stable codes: `invalid_input`, `not_found`, `stale_context`, `stale_layer_state`, and
  `unsupported_for_platform`.
- A rejected request changes nothing and adds no undo entry.
