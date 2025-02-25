import {AbstractLayer} from '/src/core/layers/abstract.layer';

interface Boundaries {
    left: number;
    right: number;
    top: number;
    bottom: number;
}

interface LayerPosition {
    x1: number;
    x2: number;
    y1: number;
    y2: number;
}

export function alignLayer(event, layer: AbstractLayer, session) {
    const bounds = layer.bounds;
    const mods = layer.modifiers;
    const display = session.state.display;

    layer.pushHistory();

    // Helper to set X position (handles both x and x1/x2 cases)
    const setX = (value: number) => {
        value = Math.round(value);
        if (mods.x) {
            mods.x.setValue(value);
        } else if (mods.x1 && mods.x2) {
            const x1 = mods.x1.getValue();
            const x2 = mods.x2.getValue();
            const width = Math.abs(x2 - x1);
            if (x2 >= x1) {
                mods.x1.setValue(value);
                mods.x2.setValue(value + width);
            } else {
                mods.x1.setValue(value + width);
                mods.x2.setValue(value);
            }
        }
    };

    // Helper to set Y position (handles both y and y1/y2 cases)
    const setY = (value: number) => {
        value = Math.round(value);
        if (mods.y) {
            mods.y.setValue(value);
        } else if (mods.y1 && mods.y2) {
            const y1 = mods.y1.getValue();
            const y2 = mods.y2.getValue();
            const height = Math.abs(y2 - y1);
            if (y2 >= y1) {
                mods.y1.setValue(value);
                mods.y2.setValue(value + height);
            } else {
                mods.y1.setValue(value + height);
                mods.y2.setValue(value);
            }
        }
    };

    switch (event) {
        case 'align_left':
            setX(0);
            break;

        case 'align_center_h':
            setX((display.x - bounds.size.x) / 2);
            break;

        case 'align_right':
            setX(display.x - bounds.size.x);
            break;

        case 'align_top':
            if (layer?.getType() === 'string') {
                setY(0 + bounds.size.y);
            } else {
                setY(0);
            }
            break;

        case 'align_center_v':
            if (layer?.getType() === 'string') {
                setY((display.y - bounds.size.y) / 2 + bounds.size.y);
            } else {
                setY((display.y - bounds.size.y) / 2);
            }
            break;

        case 'align_bottom':
            if (layer?.getType() === 'string') {
                setY(display.y);
            } else {
                setY(display.y - bounds.size.y);
            }
            break;
    }
    layer.pushRedoHistory();
    session.virtualScreen.redraw();
}

export function alignMultipleLayers(alignType: string, session) {
    const selectedLayers = session.state.layers.filter((l) => l.selected) as AbstractLayer[];
    if (selectedLayers.length <= 1) return;

    const boundaries = calculateBoundaries(selectedLayers);
    alignLayersWithinBoundaries(selectedLayers, boundaries, alignType);
    session.virtualScreen.redraw();
}

function calculateBoundaries(layers: AbstractLayer[]): Boundaries {
    return layers.reduce(
        (acc, layer) => {
            const position = getLayerPosition(layer);
            const isString = layer.getType() === 'string';
            return {
                left: Math.min(acc.left, position.x1),
                right: Math.max(acc.right, position.x2),
                top: Math.min(acc.top, position.y1),
                bottom: isString ? Math.max(acc.bottom, position.y1) : Math.max(acc.bottom, position.y2),
            };
        },
        {left: Infinity, right: -Infinity, top: Infinity, bottom: -Infinity}
    );
}

function getLayerPosition(layer: AbstractLayer): LayerPosition {
    const bounds = layer.bounds;
    const mods = layer.modifiers;

    const x1 = mods.x ? mods.x.getValue() : Math.min(mods.x1.getValue(), mods.x2.getValue());
    const x2 = mods.x ? x1 + bounds.size.x : Math.max(mods.x1.getValue(), mods.x2.getValue());
    const y1 = mods.y ? mods.y.getValue() : Math.min(mods.y1.getValue(), mods.y2.getValue());
    const y2 = mods.y ? y1 + bounds.size.y : Math.max(mods.y1.getValue(), mods.y2.getValue());

    return {x1, x2, y1, y2};
}

function alignLayersWithinBoundaries(layers: AbstractLayer[], boundaries: Boundaries, alignType: string) {
    layers.forEach((layer) => {
        layer.pushHistory();
        switch (alignType) {
            case 'align_center_h': {
                const centerX = boundaries.left + (boundaries.right - boundaries.left) / 2;
                const currentPos = getLayerPosition(layer);
                const width = currentPos.x2 - currentPos.x1;
                const currentCenter = currentPos.x1 + width / 2;

                // Only adjust if the layer isn't already centered (within 1px tolerance)
                if (Math.abs(currentCenter - centerX) >= 1) {
                    setHorizontalPosition(layer, centerX, true);
                }
                break;
            }

            case 'align_center_v': {
                const centerY = boundaries.top + (boundaries.bottom - boundaries.top) / 2;
                const currentPos = getLayerPosition(layer);
                const height = currentPos.y2 - currentPos.y1;
                const currentCenter = currentPos.y1 + height / 2;

                // Only adjust if the layer isn't already centered (within 1px tolerance)
                if (Math.abs(currentCenter - centerY) >= 1) {
                    setVerticalPosition(layer, centerY, true);
                }
                break;
            }

            case 'align_left':
                setHorizontalPosition(layer, boundaries.left);
                break;

            case 'align_right':
                setHorizontalPosition(layer, boundaries.right, false, true);
                break;

            case 'align_top':
                setVerticalPosition(layer, boundaries.top);
                break;

            case 'align_bottom': {
                const currentPos = getLayerPosition(layer);
                if (Math.abs(currentPos.y2 - boundaries.bottom) >= 1) {
                    setVerticalPosition(layer, boundaries.bottom, false, true);
                }
                break;
            }
        }
        layer.pushRedoHistory();
    });
}

function setHorizontalPosition(layer: AbstractLayer, position: number, isCenter = false, isRight = false) {
    const mods = layer.modifiers;
    const bounds = layer.bounds;
    const width = mods.x ? bounds.size.x : Math.abs(mods.x2.getValue() - mods.x1.getValue());

    let finalPosition = position;
    if (isCenter) {
        finalPosition = Math.floor(position - width / 2);
    } else if (isRight) {
        finalPosition = Math.floor(position - width);
    }

    const originalX1 = mods.x1 ? mods.x1.getValue() : null;
    const originalX2 = mods.x2 ? mods.x2.getValue() : null;
    const xReversed = originalX1 !== null && originalX2 !== null && originalX1 > originalX2;

    if (mods.x) {
        mods.x.setValue(Math.floor(finalPosition));
    } else if (mods.x1 && mods.x2) {
        if (xReversed) {
            // Preserve reversed horizontal direction
            mods.x2.setValue(Math.floor(finalPosition));
            mods.x1.setValue(Math.floor(finalPosition + width));
        } else {
            mods.x1.setValue(Math.floor(finalPosition));
            mods.x2.setValue(Math.floor(finalPosition + width));
        }
    }
}

function setVerticalPosition(layer: AbstractLayer, position: number, isCenter = false, isBottom = false) {
    const mods = layer.modifiers;
    const bounds = layer.bounds;
    const height = mods.y ? bounds.size.y : Math.abs(mods.y2.getValue() - mods.y1.getValue());
    const isText = layer.getType() === 'string';

    let finalPosition = position;
    if (isCenter) {
        finalPosition = Math.floor(position + (isText ? height / 2 : -height / 2));
    } else if (isBottom) {
        finalPosition = position - (isText ? 0 : height);
    } else if (isText) {
        finalPosition = Math.floor(position + height);
    }

    const originalY1 = mods.y1 ? mods.y1.getValue() : null;
    const originalY2 = mods.y2 ? mods.y2.getValue() : null;
    const yReversed = originalY1 !== null && originalY2 !== null && originalY1 > originalY2;

    if (mods.y) {
        mods.y.setValue(Math.floor(finalPosition));
    } else if (mods.y1 && mods.y2) {
        if (yReversed) {
            // Preserve reversed vertical direction
            mods.y2.setValue(Math.floor(finalPosition));
            mods.y1.setValue(Math.floor(finalPosition + height));
        } else {
            mods.y1.setValue(Math.floor(finalPosition));
            mods.y2.setValue(Math.floor(finalPosition + height));
        }
    }
}
