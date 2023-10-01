import {createApp} from "vue";
import './styles.css';
import { fuiRootTmpl } from "./js/templates";
import { fuiCanvasComponent } from "./js/fui-canvas";
import { fuiButtonComponent, fuiCodeComponent, fuiDisplaysComponent, fuiFileComponent, fuiIconsComponent, fuiInspectorComponent, fuiInspectorInputComponent, fuiLayersComponent, fuiLibraryComponent, fuiTabsComponent, fuiToolsComponent } from "./js/components";
import { generateCode, toCppVariableName } from "./js/utils";


createApp({
  template: fuiRootTmpl,
  data() {
    return {
      fuiImages: {},
      customImages: [],
      codePreview: "",
      screenElements: [],
      currentLayer: null,

      activeTool: "draw",
      activeTab: "code",

      isInverted: false,
      library: "u8g2",
      display: "128×64",
      layerIndex: 0,
      imageDataCache: {},
    };
  },
  computed: {
    isEmpty() {
      return this.screenElements.length === 0;
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
    // this.screenElements = JSON.parse(localStorage.getItem("lopaka_layers")) ?? [];
    window.addEventListener("message", (event) => {
      if (event.data && event.data.target === "lopaka_app") {
        switch (event.data.type) {
          case "updateLayers":
            this.screenElements = event.data.layers;
            break;
          case "loadProject":
            this.screenElements = event.data.payload.layers;
            this.library = event.data.payload.library;
            this.display = event.data.payload.display;
            break;
        }
        this.layerIndex = this.screenElements.length;
        this.redrawCanvas();
      }
    });
  },
  mounted() {
    if (this.isFlipper) {
      this.activeTool = "frame";
    }
    if (this.screenElements.length) {
      this.updateCode();
      this.layerIndex = this.screenElements.length;
    }
    this.postMessage("mounted");
  },
  methods: {
    setactiveTab(tab) {
      this.activeTab = tab;
    },
    prepareImages(e) {
      this.fuiImages = e;
    },
    updateFuiImages(layer) {
      const { name, element, width, height } = layer;
      const nameFormatted = toCppVariableName(name);
      if (!this.fuiImages[name]) {
        this.fuiImages[name] = {
          width: width,
          height: height,
          element: element,
          isCustom: true,
        };
        this.customImages = [
          ...this.customImages,
          {
            name: nameFormatted,
            width: width,
            height: height,
            element: element,
            src: element.src,
            isCustom: true,
          },
        ];
      }
      this.setactiveTab("icons");
    },
    setActiveTool(tool) {
      this.activeTool = tool;
    },
    addScreenLayer(layer) {
      this.screenElements = [
        ...this.screenElements,
        layer ? layer : this.currentLayer,
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
        this.screenElements = this.screenElements.map((item) => {
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
      if (this.currentLayer && this.currentLayer.index === index) {
        this.currentLayer = undefined;
      }
      this.screenElements = this.screenElements.filter(
        (item) => item.index !== index
      );
      this.updateCode();
      this.redrawCanvas();
      this.saveLayers();
    },
    resetScreen() {
      this.screenElements = [];
      this.codePreview = "";
      this.currentLayer = undefined;
      this.redrawCanvas();
      this.saveLayers();
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
          delete this.imageDataCache[key];
        }
      }
      this.customImages = [];
      this.screenElements = this.screenElements.filter(
        (item) => !item.isCustom
      );
      this.redrawCanvas();
      this.saveLayers();
      if (this.currentLayer && this.currentLayer.isCustom) {
        this.currentLayer = undefined;
      }
    },
    selectLibrary(library) {
      this.library = library;
      if (library === "flipper") {
        if (this.activeTool === "draw") {
          this.activeTool = "frame";
        };
        this.display = "128×64";
        localStorage.setItem("lopaka_display", this.display);
      }
      this.updateCode();
      localStorage.setItem("lopaka_library", library);
    },
    updateCode() {
      const context = this.$refs.fuiCanvas.$refs.screen.getContext("2d", {
        willReadFrequently: true,
      });
      this.codePreview = generateCode(
        this.screenElements,
        this.library,
        context,
        this.imageDataCache,
      );
    },
    postMessage(type, data) {
      if (window.top !== window.self) {
        window.top.postMessage({ target: "lopaka_app", type: type, payload: data }, "*");
      }
    },
    saveLayers() {
      this.postMessage("updateLayers", JSON.stringify(this.screenElements));
    },
    addImageToCanvas(name) {
      this.$refs.fuiCanvas.addImageToCanvas(name);
    },
    selectDisplay(display) {
      this.display = display;
      localStorage.setItem("lopaka_display", display);
    },
  },
})
  .component("fui-canvas", fuiCanvasComponent)
  .component("fui-layers", fuiLayersComponent)
  .component("fui-button", fuiButtonComponent)
  .component("fui-file", fuiFileComponent)
  .component("fui-icons", fuiIconsComponent)
  .component("fui-tools", fuiToolsComponent)
  .component("fui-inspector", fuiInspectorComponent)
  // .component("fui-settings", fuiSettingsComponent)
  .component("fui-code", fuiCodeComponent)
  .component("fui-tabs", fuiTabsComponent)
  .component("fui-inspector-input", fuiInspectorInputComponent)
  .component("fui-library", fuiLibraryComponent)
  .component("fui-display", fuiDisplaysComponent)
  .mount("#lopaka_app");
