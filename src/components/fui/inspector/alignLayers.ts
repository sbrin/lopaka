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
            const curX1 = mods.x1.getValue();
            const curX2 = mods.x2.getValue();
            if (mods.x3) {
                const curX3 = mods.x3.getValue();
                const dx = value - Math.min(curX1, curX2, curX3);
                mods.x1.setValue(curX1 + dx);
                mods.x2.setValue(curX2 + dx);
                mods.x3.setValue(curX3 + dx);
            } else {
                const width = Math.abs(curX2 - curX1);
                if (curX2 >= curX1) {
                    mods.x1.setValue(value);
                    mods.x2.setValue(value + width);
                } else {
                    mods.x1.setValue(value + width);
                    mods.x2.setValue(value);
                }
            }
        }
    };

    // Helper to set Y position (handles both y and y1/y2 cases)
    const setY = (value: number) => {
        value = Math.round(value);
        if (mods.y) {
            mods.y.setValue(value);
        } else if (mods.y1 && mods.y2) {
            const curY1 = mods.y1.getValue();
            const curY2 = mods.y2.getValue();
            if (mods.y3) {
                const curY3 = mods.y3.getValue();
                const dy = value - Math.min(curY1, curY2, curY3);
                mods.y1.setValue(curY1 + dy);
                mods.y2.setValue(curY2 + dy);
                mods.y3.setValue(curY3 + dy);
            } else {
                const height = Math.abs(curY2 - curY1);
                if (curY2 >= curY1) {
                    mods.y1.setValue(value);
                    mods.y2.setValue(value + height);
                } else {
                    mods.y1.setValue(value + height);
                    mods.y2.setValue(value);
                }
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
    const selectedLayers = session.layersManager.selected;
    if (selectedLayers.length <= 1) return;

    // Collapse the multi-layer alignment into a single undo entry when history batching is available
    const canBatch = Boolean(session.history?.batchStart && session.history?.batchEnd);
    if (canBatch) {
        session.history.batchStart();
    }
    try {
        const boundaries = calculateBoundaries(selectedLayers);
        alignLayersWithinBoundaries(selectedLayers, boundaries, alignType);
        session.virtualScreen.redraw();
    } finally {
        if (canBatch) {
            session.history.batchEnd();
        }
    }
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

    if (mods.x) {
        const x1 = mods.x.getValue();
        const y1 = mods.y.getValue();
        return {x1, x2: x1 + bounds.size.x, y1, y2: y1 + bounds.size.y};
    }

    const xValues = [mods.x1.getValue(), mods.x2.getValue()];
    const yValues = [mods.y1.getValue(), mods.y2.getValue()];
    if (mods.x3) xValues.push(mods.x3.getValue());
    if (mods.y3) yValues.push(mods.y3.getValue());

    return {
        x1: Math.min(...xValues),
        x2: Math.max(...xValues),
        y1: Math.min(...yValues),
        y2: Math.max(...yValues),
    };
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

    if (mods.x3) {
        const curX1 = mods.x1.getValue();
        const curX2 = mods.x2.getValue();
        const curX3 = mods.x3.getValue();
        const minX = Math.min(curX1, curX2, curX3);
        const maxX = Math.max(curX1, curX2, curX3);
        const width = maxX - minX;

        let finalPosition = position;
        if (isCenter) {
            finalPosition = Math.floor(position - width / 2);
        } else if (isRight) {
            finalPosition = Math.floor(position - width);
        }

        const dx = Math.floor(finalPosition) - minX;
        mods.x1.setValue(curX1 + dx);
        mods.x2.setValue(curX2 + dx);
        mods.x3.setValue(curX3 + dx);
        return;
    }

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

    if (mods.y3) {
        const curY1 = mods.y1.getValue();
        const curY2 = mods.y2.getValue();
        const curY3 = mods.y3.getValue();
        const minY = Math.min(curY1, curY2, curY3);
        const maxY = Math.max(curY1, curY2, curY3);
        const height = maxY - minY;

        let finalPosition = position;
        if (isCenter) {
            finalPosition = Math.floor(position - height / 2);
        } else if (isBottom) {
            finalPosition = position - height;
        }

        const dy = Math.floor(finalPosition) - minY;
        mods.y1.setValue(curY1 + dy);
        mods.y2.setValue(curY2 + dy);
        mods.y3.setValue(curY3 + dy);
        return;
    }

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
            mods.y2.setValue(Math.floor(finalPosition));
            mods.y1.setValue(Math.floor(finalPosition + height));
        } else {
            mods.y1.setValue(Math.floor(finalPosition));
            mods.y2.setValue(Math.floor(finalPosition + height));
        }
    }
}
