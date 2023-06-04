Vue.createApp({
    template: fuiRootTmpl,
    data() {
        return {
            fuiImages: {},
            customImages: [],
            codePreview: "",
            screenElements: [],
            currentLayer: null,

            activeTool: "frame",
            activeTab: "code",

            isInverted: false,
            library: "flipper",

            display: "128×64",
            layerIndex: 0,
        };
    },
    computed: {
        isEmpty() {
            return this.screenElements.length === 0
        },
    },
    methods: {
        setactiveTab(tab) {
            this.activeTab = tab;
            this.updateCode();
        },
        prepareImages(e) {
            this.fuiImages = e;
        },
        updateFuiImages(layer) {
            const { name, element, width, height } = layer;
            if (!this.fuiImages[name]) {
                this.fuiImages[name] = {
                    width: width,
                    height: height,
                    element: element,
                    isCustom: true,
                };
                this.customImages = [...this.customImages, {
                    name: name,
                    width: width,
                    height: height,
                    element: element,
                    src: element.src,
                    isCustom: true,
                }];
            }
            this.setactiveTab("icons")
        },
        setActiveTool(tool) {
            this.activeTool = tool;
        },
        addScreenLayer(layer) {
            this.screenElements = [
                ...this.screenElements,
                (layer ? layer : this.currentLayer),
            ];
            this.layerIndex += 1;
            this.redrawCanvas();
        },
        updateCurrentLayer(layerProps) {
            if (layerProps) {
                const layer = {
                    ...this.currentLayer,
                    ...layerProps,
                };
                this.screenElements = this.screenElements.map(item => {
                    if (item.index === layer.index) {
                        return layer;
                    }
                    return item;
                });
                this.currentLayer = layer;
            } else {
                this.currentLayer = undefined;
            }
        },
        removeLayer(index) {
            if (index === this.currentLayer.index) this.currentLayer = undefined;
            this.screenElements = this.screenElements.filter(
                (item) => item.index !== index
            );
            this.redrawCanvas();
        },
        resetScreen() {
            this.screenElements = [];
            this.codePreview = "";
            this.currentLayer = undefined;
            this.redrawCanvas();
        },
        redrawCanvas() {
            this.$refs.fuiCanvas.redrawCanvas(this.screenElements);
        },
        copyCode() {
            navigator.clipboard.writeText(this.codePreview);
        },
        cleanCustomIcons() {
            this.customImages = [];
            this.screenElements = this.screenElements.filter(item => !item.isCustom);
            this.redrawCanvas();
            if (this.currentLayer && this.currentLayer.isCustom) {
                this.currentLayer = undefined;
            }
        },
        toggleInvert() {
            this.isInverted = !this.isInverted;
            this.redrawCanvas();
        },
        selectLibrary(lib) {
            this.library = lib;
            this.updateCode();
        },
        updateCode() {
            if (this.activeTab === "code") {
                const context = this.$refs.fuiCanvas.$refs.screen.getContext("2d", { willReadFrequently: true });
                this.codePreview = generateCode(this.screenElements, this.isInverted, this.library, context);
            }
        },
        addImageToCanvas(name) {
            this.$refs.fuiCanvas.addImageToCanvas(name);
        },
        updateDisplay(display) {
            this.display = display;
        }
    },
})
    .component("fui-canvas", fuiCanvasComponent)
    .component("fui-layers", fuiLayersComponent)
    .component("fui-button", fuiButtonComponent)
    .component("fui-file", fuiFileComponent)
    .component("fui-icons", fuiIconsComponent)
    .component("fui-tools", fuiToolsComponent)
    .component("fui-inspector", fuiInspectorComponent)
    .component("fui-settings", fuiSettingsComponent)
    .component("fui-code", fuiCodeComponent)
    .component("fui-tabs", fuiTabsComponent)
    .component("fui-inspector-input", fuiInspectorInputComponent)
    .component("fui-library", fuiLibraryComponent)
    .component("fui-display", fuiDisplaysComponent)
    .mount("#fuigen_app");