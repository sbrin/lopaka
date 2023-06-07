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
            library: "u8g2_arduino",

            display: "128×64",
            layerIndex: 0,
        };
    },
    computed: {
        isEmpty() {
            return this.screenElements.length === 0
        },
        isFlipper() {
            return this.library === "flipper";
        },
    },
    created() {
        if (localStorage.getItem("lopaka_library")) {
            this.library = localStorage.getItem("lopaka_library");
        }
        if (localStorage.getItem("lopaka_display")) {
            this.display = localStorage.getItem("lopaka_display");
        }
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
            console.log(index);
            if (this.currentLayer && this.currentLayer.index === index) {
                this.currentLayer = undefined;
            };
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
            for (let key in this.fuiImages) {
                if (this.fuiImages[key].isCustom) {
                    delete this.fuiImages[key];
                }
            }
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
        selectLibrary(library) {
            this.library = library;
            if (library === "flipper") {
                this.display = "128×64";
                localStorage.setItem("lopaka_display", this.display);
            }
            this.updateCode();
            localStorage.setItem("lopaka_library", library);
        },
        updateCode() {
            if (this.activeTab === "code") {
                const context = this.$refs.fuiCanvas.$refs.screen.getContext("2d", { willReadFrequently: true });
                this.codePreview = generateCode(this.screenElements, this.isInverted, this.library, context);
            }
        },
        saveLayers() {
            localStorage.setItem("lopaka_layers", JSON.stringify(this.screenElements));
        },
        addImageToCanvas(name) {
            this.$refs.fuiCanvas.addImageToCanvas(name);
        },
        selectDisplay(display) {
            this.display = display;
            localStorage.setItem("lopaka_display", display);
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
    .mount("#lopaka_app");