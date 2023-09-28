import { LIBRARIES, DEFAULT_STRING, FONT_SIZES,ICONS_SRC,KEYS,codeDeclarators,displaySizes,fontMap,invertedHeaders,numberFontsRegex,standardFontsRegex, textContainerHeight } from "./const";
import { fuiButtonTmpl, fuiFileTmpl, fuiIconsTmpl, fuiInspectorTmpl, fuiLayersTmpl, fuiToolsTmpl } from "./templates";
import { getTextWidth, loadImageAsync, readFileAsync } from "./utils";

export const fuiLayersComponent = {
  template: fuiLayersTmpl,
  props: {
    screenElements: Array,
    currentLayer: Object,
  },
  computed: {
    classNames() {
      return (item) => ({
        layer_selected: this.currentLayer && this.currentLayer.index === item.index,
        layer_ignored: item.isOverlay,
      });
    }
  },
  methods: {
    updateCurrentLayer(item) {
      this.$emit("updateCurrentLayer", item);
    },
    removeLayer(index) {
      this.$emit("removeLayer", index);
    },
    getLayerListItem(element) {
      if (element.type === "str") {
        return `${element.text || "Empty str"}`;
      }
      if (element.type === "icon") {
        return `${element.name}`;
      }
      return `${element.type}`;
    },
  },
};

export const fuiButtonComponent = {
  template: fuiButtonTmpl,
  props: {
    title: String,
    active: Boolean,
    type: String,
  },
};

export const fuiFileComponent = {
  template: fuiFileTmpl,
  props: {
    title: String,
    active: Boolean,
  },
  methods: {
    async onFileChange(e) {
      const file = e.target.files[0];
      if (!file.name) {
        return;
      }
      const name = file.name.substr(0, file.name.lastIndexOf(".")) || file.name; // remove file extension
      const fileResult = await readFileAsync(file);
      const image = await loadImageAsync(fileResult);
      this.$emit("updateFuiImages", {
        name: name,
        width: image.width,
        height: image.height,
        element: image,
        isCustom: true,
      });
    },
    resetFileInput() {
      this.$refs.fileInput.value = null;
    },
  },
};

export const fuiIconsComponent = {
  template: fuiIconsTmpl,
  data() {
    return {
      imagesSrc: [],
    };
  },
  props: {
    customImages: Array,
    fuiImages: Object,
  },
  watch: {
    customImages: function () {
      this.prepareCustomImages();
    },
  },
  methods: {
    cleanCustom() {
      this.$emit("cleanCustomIcons");
    },
    iconClick(e) {
      this.$emit("iconClicked", e.target.dataset.name);
    },
    iconDragStart(e) {
      e.dataTransfer.setData("name", e.srcElement.dataset.name);
      e.dataTransfer.setData("offset", `${e.offsetX}, ${e.offsetY}`);
    },
    prepareCustomImages() {
      const customImages = {};
      this.customImages.forEach((icon) => {
        customImages[icon.name] = {
          element: icon.element,
          width: icon.width,
          height: icon.height,
          isCustom: icon.isCustom,
        };
      });
      this.$emit("prepareImages", {
        ...this.fuiImages,
        ...customImages,
      });
    },
    prepareImages() {
      const fuiImages = {};
      const imagesArr = [];
      Object.entries(ICONS_SRC).forEach((item) => {
        const [name, file] = item;
        const matchedSizeArr = name.match(/_([0-9]+)x([0-9]+)/i)
          ? name.match(/_([0-9]+)x([0-9]+)/i)
          : [0, 10, 10];
        const [, width, height] = matchedSizeArr.map((num) =>
          parseInt(num, 10)
        );
        const image = new Image(width, height);
        const src = `img/${file}`;
        image.src = src;
        image.crossOrigin = "Anonymous";
        fuiImages[name] = {
          element: image,
          width: width,
          height: height,
          isCustom: false,
        };
        imagesArr.push({
          src: src,
          name: name,
          element: image,
          width: width,
          height: height,
        });
      });
      imagesArr.sort((a, b) => a.width * a.height - b.width * b.height);
      this.imagesSrc = imagesArr;
      this.$emit("prepareImages", fuiImages);
    },
  },
  created() {
    this.prepareImages();
  },
  mounted() { },
};

export const fuiToolsComponent = {
  template: fuiToolsTmpl,
  props: {
    callback: Function,
    activeTool: String,
    library: String,
  },
  computed: {
    toolsList() {
      return [...(this.library !== "flipper" ? ["draw"] : []), "frame", "box", "line", "dot", "circle", "disc"];
    },
  },
};

export const fuiInspectorComponent = {
  template: fuiInspectorTmpl,
  props: {
    elem: Object,
    library: String,
  },
  data() {
    return {};
  },
  computed: {
    isHWVisible() {
      // return true;
      return ["frame", "box", "draw", "icon"].includes(
        this.elem.type
      );
    },
    isHWDisabled() {
      return ["draw", "icon"].includes(
        this.elem.type
      );
    },
    isRadiusVisible() {
      return ["circle", "disc"].includes(this.elem.type);
    },
  },
  methods: {
    update(element) {
      this.$emit("updateCurrentLayer", element);
      this.$emit("redrawCanvas");
      this.$emit("saveLayers");
      this.$emit("updateCode");
    },
  },
};

export const fuiInspectorInputComponent = {
  template: `
    <span v-if="hasNoWidth">{{ element[field] }}</span>
    <select class="input-select" v-if="field === 'font'" :value="element[field]" @input="onSelect" :id="id">
      <option v-for="(font, idx) in fontsList[library]" :key="idx" :value="font">{{ font }}</option>
    </select>
    <input v-else-if="type === 'checkbox'" class="inspector__input" @input="onInput" :type="type" :id="id" :checked="element[field]"></input>
    <input v-else class="inspector__input" @input="onInput" :value="element[field]" :type="type" :id="id" max="1024" min="-1024" step="1" :disabled="disabled"></input>
    `,
  props: {
    element: Object,
    type: String,
    field: String,
    library: String,
    id: String,
    disabled: Boolean,
  },
  computed: {
    hasNoWidth() {
      return (
        ["str", "dot"].includes(element.type) &&
        ["width", "height"].includes(field)
      );
    },
  },
  data() {
    return {
      fontsList: {
        flipper: ["helvB08_tr", "haxrcorp4089_tr", "profont22_tr"],
        u8g2: ["helvB08_tr", "haxrcorp4089_tr", "profont22_tr", "f4x6_tr"],
        uint32: ["helvB08_tr", "haxrcorp4089_tr", "profont22_tr", "f4x6_tr"],
        adafruit_gfx: ["adafruit"],
      },
    };
  },
  computed: {
    charsRegex() {
      return this.element.font === "profont22_tr" && this.library === "flipper"
        ? numberFontsRegex
        : standardFontsRegex;
    },
  },
  methods: {
    onInput(e) {
      if (["checkbox"].includes(this.type)) {
        this.element[this.field] = e.target.checked;
      } else {
        const result = ["text"].includes(this.type)
          ? e.target.value.replace(this.charsRegex, "")
          : parseInt(e.target.value.replace(/[^0-9\-]/g, ""));
        e.target.value = result;
        this.element[this.field] = result;
        if (["text"].includes(this.field)) {
          this.updateTextWidth();
        }
      }
      this.$emit("update", this.element);
    },
    onSelect(e) {
      this.element[this.field] = e.target.value;
      if (["font"].includes(this.field)) {
        this.element.text = this.element.text
          .replace(this.charsRegex, "")
          .trim();
        this.updateTextWidth();
      }
      this.$emit("update", this.element);
    },
    updateTextWidth() {
      // recalculate text draggable area size
      this.element.width = getTextWidth(this.element.text, this.element.font);
      this.element.height = textContainerHeight[this.element.font];
      this.element.yy = this.element.y - textContainerHeight[this.element.font];
    },
  },
};
// const fuiSettingsComponent = {
//     template: `<div class="fui-settings">
//         <div class="fui-settings__input">
//             <button class="button" :class="settingsClassNames" @click="toggleInvert">Invert color</label>
//         </div>
//     </div>`,
//     props: {
//         isInverted: Boolean,
//     },
//     data() {
//         return {};
//     },
//     computed: {
//         settingsClassNames() {
//             return {
//                 "button_active": this.isInverted,
//             };
//         },
//     },
//     methods: {
//         toggleInvert() {
//             this.$emit("toggleInvert");
//         },
//     }
// }

export const fuiCodeComponent = {
  template: `
    <div class="fui-code">
      <pre>{{ content }}</pre>
    </div>
        `,
  props: {
    content: String,
  },
};
export const fuiLibraryComponent = {
  template: `
    <div class="fui-select">
        <label for="library" class="fui-select__label">Library: </label>
        <select id="library" class="fui-select__select input-select" :value="library" @input="onSelect">
            <option v-for="(lib, idx) in Object.keys(libs)" :key="idx" :value="lib">{{ libs[lib] }}</option>
        </select>
    </div>
        `,
  props: {
    library: String,
  },
  data() {
    return {
      libs: LIBRARIES,
    };
  },
  methods: {
    onSelect(e) {
      this.$emit("selectLibrary", e.target.value);
    },
  },
};

export const fuiDisplaysComponent = {
  template: `
    <div class="fui-displays fui-select">
        <label for="display-size" class="fui-select__label">Display: </label>
        <select id="display-size" class="fui-select__select input-select" :value="display" @input="onSelect">
            <option v-for="(item, idx) in sizes" :key="idx" :value="item">{{ item }}</option>
        </select>
    </div>
        `,
  props: {
    display: String,
  },
  data() {
    return {
      sizes: displaySizes,
    };
  },
  mounted() {
    this.$emit("updateDisplay", this.display);
  },
  methods: {
    onSelect(e) {
      this.$emit("updateDisplay", e.target.value);
    },
  },
};

export const fuiTabsComponent = {
  template: `
    <div class="fui-tabs">
      <div v-for="(tab, idx) in tabs" :key="idx" class="fui-tab" :class="{'fui-tab_active': activeTab === tab}"
        @click="setActiveTab(tab)">{{ tab }}</div>
    </div>
        `,
  props: {
    activeTab: String,
  },
  data() {
    return {
      tabs: ["code", "icons"],
    };
  },
  methods: {
    setActiveTab(tab) {
      this.$emit("setActiveTab", tab);
    },
  },
};
