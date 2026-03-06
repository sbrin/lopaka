import {describe, expect, it, beforeEach, vi} from 'vitest';
import {AddPlugin} from './add.plugin';
import {RectangleLayer} from '../../core/layers/rectangle.layer';
import {Point} from '../../core/point';
import {TPlatformFeatures} from '../../platforms/platform';
import {AbstractLayer, EditMode} from '../../core/layers/abstract.layer';
import {RectTool} from '../tools/rect.tool';
import {TextLayer} from '../../core/layers/text.layer';
import {TextAreaLayer} from '../../core/layers/text-area.layer';
import {PixelatedDrawingRenderer} from '../../draw/renderers';

const features: TPlatformFeatures = {
    hasCustomFontSize: false,
    hasInvertedColors: false,
    hasRGBSupport: true, // Default to true for most tests
    hasIndexedColors: false,
    defaultColor: '#ffffff',
    interfaceColors: {
        selectColor: '#fff',
        resizeIconColor: '#fff',
        hoverColor: '#fff',
        rulerColor: '#fff',
        rulerLineColor: '#fff',
        selectionStrokeColor: '#fff',
    },
};

const monochromeFeatures: TPlatformFeatures = {
    hasCustomFontSize: false,
    hasInvertedColors: false,
    hasRGBSupport: false,
    hasIndexedColors: false,
    defaultColor: '#000000',
    interfaceColors: {
        selectColor: '#fff',
        resizeIconColor: '#fff',
        hoverColor: '#fff',
        rulerColor: '#fff',
        rulerLineColor: '#fff',
        selectionStrokeColor: '#fff',
    },
};

type TestSession = {
    state: {
        layers: AbstractLayer[];
        brushColor: string;
        selectionUpdates: number;
    };
    getPlatformFeatures: () => TPlatformFeatures;
    editor: {
        session: TestSession;
        lastColor: string | null | undefined;
        triggerTextEdit: ReturnType<typeof vi.fn>;
        state: {
            activeTool: RectTool | null;
            activeLayer: AbstractLayer | null;
            textEditMode: number;
        };
    };
    virtualScreen: {redraw: ReturnType<typeof vi.fn>};
    layersManager: {
        clearSelection: ReturnType<typeof vi.fn>;
        selectLayer: ReturnType<typeof vi.fn>;
        eachLayer: ReturnType<typeof vi.fn>;
        readonly sorted: AbstractLayer[];
        readonly selected: AbstractLayer[];
    };
    addLayer: (layer: AbstractLayer) => void;
    createRenderer: () => PixelatedDrawingRenderer;
};

const createTestSession = (platformFeatures: TPlatformFeatures): TestSession => {
    const state = {
        layers: [] as AbstractLayer[],
        brushColor: '#ff0000',
        selectionUpdates: 0,
    };

    const session = {
        state,
        getPlatformFeatures: () => platformFeatures,
        editor: {
            session: null as unknown as TestSession,
            lastColor: null as string | null | undefined,
            triggerTextEdit: vi.fn(),
            state: {
                activeTool: null as RectTool | null,
                activeLayer: null as AbstractLayer | null,
                textEditMode: 0,
            },
        },
        virtualScreen: {
            redraw: vi.fn(),
        },
        layersManager: null as unknown as TestSession['layersManager'],
        addLayer: (layer: AbstractLayer) => {
            layer.index = layer.index ?? state.layers.length + 1;
            state.layers.unshift(layer);
        },
        // Provide renderer instances to mimic platform drawing in tests
        createRenderer: () => new PixelatedDrawingRenderer(),
    } as TestSession;

    const eachLayer = vi.fn((callback: (layer: AbstractLayer) => void) => {
        state.layers
            .filter((layer) => !layer.locked && !layer.hidden)
            .forEach((layer) => callback(layer));
    });

    const layersManager: TestSession['layersManager'] = {
        clearSelection: vi.fn(() => {
            eachLayer((layer: AbstractLayer) => {
                layer.selected = false;
            });
            state.selectionUpdates++;
        }),
        selectLayer: vi.fn((layer: AbstractLayer) => {
            if (!layer.locked && !layer.hidden) {
                layer.selected = true;
                state.selectionUpdates++;
            }
        }),
        eachLayer,
        get sorted() {
            return state.layers
                .slice()
                .sort((a, b) => (a.index ?? 0) - (b.index ?? 0));
        },
        get selected() {
            return state.layers.filter((layer) => layer.selected && !layer.locked && !layer.hidden);
        },
    };

    session.layersManager = layersManager;
    session.editor.session = session;

    return session;
};

describe('AddPlugin', () => {
    let session: TestSession;
    let plugin: AddPlugin;
    let container: HTMLDivElement;
    let rectTool: RectTool;

    beforeEach(() => {
        container = document.createElement('div');
        
        session = createTestSession(features);

        // Create tool with proper editor reference
        rectTool = new RectTool(session.editor as any);
        
        // Set the tool as active
        session.editor.state.activeTool = rectTool;

        plugin = new AddPlugin(session as any, container);
    });

    it('should use brushColor as fallback when lastColor is null', () => {
        // Arrange
        session.editor.lastColor = null;
        session.state.brushColor = '#00ff00'; // Green brush color
        const point = new Point(10, 10);

        // Act
        plugin.onMouseDown(point, new MouseEvent('mousedown'));

        // Assert
        expect(session.state.layers.length).toBe(1);
        const createdLayer = session.state.layers[0];
        expect(createdLayer.color).toBe('#00ff00'); // Should use brushColor
        expect(session.editor.state.activeLayer).toBe(createdLayer);
        expect(session.virtualScreen.redraw).toHaveBeenCalled();
    });

    it('should use brushColor as fallback when lastColor is undefined', () => {
        // Arrange
        session.editor.lastColor = undefined;
        session.state.brushColor = '#0000ff'; // Blue brush color
        const point = new Point(10, 10);

        // Act
        plugin.onMouseDown(point, new MouseEvent('mousedown'));

        // Assert
        expect(session.state.layers.length).toBe(1);
        const createdLayer = session.state.layers[0];
        expect(createdLayer.color).toBe('#0000ff'); // Should use brushColor
    });

    it('should prioritize lastColor over brushColor when both are available', () => {
        // Arrange
        session.editor.lastColor = '#ffff00'; // Yellow last color
        session.state.brushColor = '#ff00ff'; // Magenta brush color
        const point = new Point(10, 10);

        // Act
        plugin.onMouseDown(point, new MouseEvent('mousedown'));

        // Assert
        expect(session.state.layers.length).toBe(1);
        const createdLayer = session.state.layers[0];
        expect(createdLayer.color).toBe('#ffff00'); // Should use lastColor, not brushColor
    });

    it('should use lastColor when available and brushColor is null', () => {
        // Arrange
        session.editor.lastColor = '#00ffff'; // Cyan last color
        session.state.brushColor = null;
        const point = new Point(10, 10);

        // Act
        plugin.onMouseDown(point, new MouseEvent('mousedown'));

        // Assert
        expect(session.state.layers.length).toBe(1);
        const createdLayer = session.state.layers[0];
        expect(createdLayer.color).toBe('#00ffff'); // Should use lastColor
    });

    it('should use defaultColor for monochrome platforms without RGB or indexed colors', () => {
        // Arrange - Create a new session with monochrome features
        const monochromeSession = createTestSession(monochromeFeatures);
        const monochromePlugin = new AddPlugin(monochromeSession as any, container);
        
        // Set up monochrome tool with proper editor reference
        const monochromeTool = new RectTool(monochromeSession.editor as any);
        monochromeSession.editor.state.activeTool = monochromeTool;
        
        monochromeSession.editor.lastColor = '#ff0000'; // Red last color
        monochromeSession.state.brushColor = '#00ff00'; // Green brush color
        const point = new Point(10, 10);

        // Act
        monochromePlugin.onMouseDown(point, new MouseEvent('mousedown'));

        // Assert
        expect(monochromeSession.state.layers.length).toBe(1);
        const createdLayer = monochromeSession.state.layers[0];
        expect(createdLayer.color).toBe('#000000'); // Should use defaultColor, ignoring lastColor and brushColor
    });

    it('should use lastColor/brushColor fallback for platforms with RGB support', () => {
        // Arrange - Use features with RGB support (default)
        session.editor.lastColor = null;
        session.state.brushColor = '#00ff00'; // Green brush color
        const point = new Point(10, 10);

        // Act
        plugin.onMouseDown(point, new MouseEvent('mousedown'));

        // Assert
        expect(session.state.layers.length).toBe(1);
        const createdLayer = session.state.layers[0];
        expect(createdLayer.color).toBe('#00ff00'); // Should use brushColor fallback
    });

    it('should use lastColor/brushColor fallback for platforms with indexed colors', () => {
        // Arrange - Create features with indexed colors but no RGB
        const indexedFeatures: TPlatformFeatures = {
            ...features,
            hasRGBSupport: false,
            hasIndexedColors: true,
        };
        
        const indexedSession = createTestSession(indexedFeatures);
        const indexedPlugin = new AddPlugin(indexedSession as any, container);
        
        // Set up indexed tool with proper editor reference
        const indexedTool = new RectTool(indexedSession.editor as any);
        indexedSession.editor.state.activeTool = indexedTool;
        
        indexedSession.editor.lastColor = '#ff0000'; // Red last color
        indexedSession.state.brushColor = '#00ff00'; // Green brush color
        const point = new Point(10, 10);

        // Act
        indexedPlugin.onMouseDown(point, new MouseEvent('mousedown'));

        // Assert
        expect(indexedSession.state.layers.length).toBe(1);
        const createdLayer = indexedSession.state.layers[0];
        expect(createdLayer.color).toBe('#ff0000'); // Should use lastColor, not defaultColor
    });

    it('should use brushColor fallback for platforms with indexed colors when lastColor is null', () => {
        // Arrange - Create features with indexed colors but no RGB
        const indexedFeatures: TPlatformFeatures = {
            ...features,
            hasRGBSupport: false,
            hasIndexedColors: true,
        };
        
        const indexedSession = createTestSession(indexedFeatures);
        const indexedPlugin = new AddPlugin(indexedSession as any, container);
        
        // Set up indexed tool with proper editor reference
        const indexedTool = new RectTool(indexedSession.editor as any);
        indexedSession.editor.state.activeTool = indexedTool;
        
        indexedSession.editor.lastColor = null;
        indexedSession.state.brushColor = '#00ff00'; // Green brush color
        const point = new Point(10, 10);

        // Act
        indexedPlugin.onMouseDown(point, new MouseEvent('mousedown'));

        // Assert
        expect(indexedSession.state.layers.length).toBe(1);
        const createdLayer = indexedSession.state.layers[0];
        expect(createdLayer.color).toBe('#00ff00'); // Should use brushColor fallback
    });

    it('should not create layer when no active tool is set', () => {
        // Arrange
        session.editor.state.activeTool = null;
        const point = new Point(10, 10);

        // Act
        plugin.onMouseDown(point, new MouseEvent('mousedown'));

        // Assert
        expect(session.state.layers.length).toBe(0);
        expect(session.editor.state.activeLayer).toBeNull();
        expect(session.virtualScreen.redraw).not.toHaveBeenCalled();
    });

    it('should create layer when activeLayer exists but is not editing', () => {
        // Arrange
        const existingLayer = new RectangleLayer(features);
        existingLayer.position = new Point(0, 0);
        existingLayer.size = new Point(10, 10);
        existingLayer.stopEdit();
        session.editor.state.activeLayer = existingLayer;
        const point = new Point(10, 10);

        // Act
        plugin.onMouseDown(point, new MouseEvent('mousedown'));

        // Assert
        expect(session.state.layers.length).toBe(1);
        expect(session.editor.state.activeLayer).not.toBe(existingLayer);
        expect(session.virtualScreen.redraw).toHaveBeenCalled();
    });

    it('should not create layer when activeLayer is currently editing', () => {
        // Arrange
        const editingLayer = new RectangleLayer(features);
        editingLayer.startEdit(EditMode.CREATING, new Point(0, 0), null as any);
        session.editor.state.activeLayer = editingLayer;
        const point = new Point(10, 10);

        // Act
        plugin.onMouseDown(point, new MouseEvent('mousedown'));

        // Assert
        expect(session.state.layers.length).toBe(0);
        expect(session.editor.state.activeLayer).toBe(editingLayer);
        expect(session.virtualScreen.redraw).not.toHaveBeenCalled();
    });

    it('should not create layer when another layer is being edited', () => {
        // Arrange
        const editingLayer = new RectangleLayer(features);
        editingLayer.position = new Point(0, 0);
        editingLayer.size = new Point(10, 10);
        editingLayer.startEdit = vi.fn();
        editingLayer.isEditing = vi.fn().mockReturnValue(true);
        session.state.layers = [editingLayer];
        const point = new Point(10, 10);

        // Act
        plugin.onMouseDown(point, new MouseEvent('mousedown'));

        // Assert
        expect(session.state.layers.length).toBe(1); // Only the existing editing layer
        expect(session.editor.state.activeLayer).toBeNull();
        expect(session.virtualScreen.redraw).not.toHaveBeenCalled();
    });

    it('should deselect all layers before creating new layer', () => {
        // Arrange
        const layer1 = new RectangleLayer(features);
        layer1.selected = true;
        // Ensure layer1 is not in editing mode
        layer1['mode'] = EditMode.NONE;
        
        const layer2 = new RectangleLayer(features);
        layer2.selected = true;
        // Ensure layer2 is not in editing mode
        layer2['mode'] = EditMode.NONE;
        
        // Make sure we're setting the layers on the session state
        session.state.layers = [layer1, layer2];
        session.editor.lastColor = '#ff0000';
        const point = new Point(10, 10);

        // Verify initial state
        expect(layer1.selected).toBe(true);
        expect(layer2.selected).toBe(true);
        expect(layer1.isEditing()).toBe(false);
        expect(layer2.isEditing()).toBe(false);
        expect(session.state.layers.length).toBe(2);

        // Act
        plugin.onMouseDown(point, new MouseEvent('mousedown'));

        // Assert - layers should be deselected
        expect(layer1.selected).toBe(false);
        expect(layer2.selected).toBe(false);
        expect(session.state.layers.length).toBe(3); // Original 2 + new 1
        
        // Verify the new layer was created but not yet selected (selection happens on mouseUp)
        const newLayer = session.state.layers.find((layer) => layer !== layer1 && layer !== layer2);
        expect(newLayer).toBeDefined();
        expect(newLayer?.selected).toBe(false); // Not selected yet, will be selected on mouseUp
    });

    it('should complete layer creation on mouse up', () => {
        // Arrange
        session.editor.lastColor = '#ff0000';
        const point = new Point(10, 10);
        
        // Start layer creation
        plugin.onMouseDown(point, new MouseEvent('mousedown'));
        const createdLayer = session.state.layers[0];
        createdLayer.stopEdit = vi.fn();
        createdLayer.selected = false;

        // Act
        plugin.onMouseUp(point, new MouseEvent('mouseup'));

        // Assert
        expect(createdLayer.stopEdit).toHaveBeenCalled();
        expect(createdLayer.selected).toBe(true);
        expect(session.virtualScreen.redraw).toHaveBeenCalledTimes(2); // Once on down, once on up
        expect(session.layersManager.selectLayer).toHaveBeenCalledWith(createdLayer);
    });

    it('should trigger text edit mode when creating a text layer', () => {
        // Arrange
        const fakeFont = {
            getSize: vi.fn(() => new Point(10, 10)),
            drawText: vi.fn(),
            format: undefined,
        };
        const renderer = new PixelatedDrawingRenderer();
        // Build a text layer with the renderer and fake font to mirror real creation order
        const textLayer = new TextLayer(features, renderer, fakeFont as any);
        const textTool = {
            createLayer: () => textLayer,
            onStartEdit: vi.fn(),
            onStopEdit: vi.fn(),
            isMultiClick: () => false,
        } as unknown as RectTool;

        session.editor.state.activeTool = textTool;

        const point = new Point(10, 10);

        // Act
        plugin.onMouseDown(point, new MouseEvent('mousedown'));
        plugin.onMouseUp(point, new MouseEvent('mouseup'));

        // Assert
        expect(session.editor.triggerTextEdit).toHaveBeenCalledTimes(1);
    });

    it('should trigger text edit mode when creating a text area layer', () => {
        // Arrange a fake font to avoid loading font assets.
        const fakeFont = {
            getSize: vi.fn(() => new Point(10, 10)),
            drawText: vi.fn(),
            format: undefined,
        };
        // Arrange a renderer for the text area layer.
        const renderer = new PixelatedDrawingRenderer();
        // Build a text area layer with the renderer and fake font.
        const textAreaLayer = new TextAreaLayer(features, renderer, fakeFont as any);
        // Arrange a tool that creates the text area layer.
        const textAreaTool = {
            createLayer: () => textAreaLayer,
            onStartEdit: vi.fn(),
            onStopEdit: vi.fn(),
            isMultiClick: () => false,
        } as unknown as RectTool;

        session.editor.state.activeTool = textAreaTool;

        const point = new Point(12, 12);

        // Act by creating and finalizing the layer.
        plugin.onMouseDown(point, new MouseEvent('mousedown'));
        plugin.onMouseUp(point, new MouseEvent('mouseup'));

        // Assert the text edit mode is triggered for text area layers.
        expect(session.editor.triggerTextEdit).toHaveBeenCalledTimes(1);
    });
});
