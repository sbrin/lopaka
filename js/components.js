
const fuiLayersComponent = {
    template: fuiLayersTmpl,
    props: {
        screenElements: Array,
        screenCurrentElement: Object,
    },
    methods: {
        setCurrentItem(item) {
            this.$emit("setCurrentItem", item);
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
    }
}

const fuiButtonComponent = {
    template: fuiButtonTmpl,
    props: {
        title: String,
        active: Boolean
    }
}

const fuiIconsComponent = {
    template: fuiIconsTmpl,
    data() {
        return {
            imagesSrc: [],
        };
    },
    props: {
        customImages: Array,
    },
    watch: {
        customImages: function () {
            this.prepareImages();
        }
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
        prepareImages() {
            const fuiImages = {};
            const imagesArr = [];
            Object.entries(ICONS_SRC).forEach((item) => {
                const [name, file] = item;
                const matchedSizeArr = name.match(/_([0-9]+)x([0-9]+)/i) ? name.match(/_([0-9]+)x([0-9]+)/i) : [0, 10, 10];
                const [, width, height] = matchedSizeArr.map((num) => parseInt(num, 10));
                const image = new Image(width, height);
                const src = `img/${file}`;
                image.src = src;
                image.crossOrigin = "Anonymous";
                fuiImages[name] = {
                    element: image,
                    width: width,
                    height: height
                };
                imagesArr.push({
                    src: src,
                    name: name,
                    element: image,
                    width: width,
                    height: height
                });
            });
            this.customImages.forEach(icon => {
                fuiImages[icon.name] = {
                    element: icon.element,
                    width: icon.width,
                    height: icon.height,
                    custom: icon.custom,
                };
            });
            imagesArr.sort((a, b) => a.width * a.height - b.width * b.height);
            this.imagesSrc = imagesArr;
            this.$emit("prepareImages", fuiImages);
        }
    },
    created() {
    },
    mounted() {
        this.prepareImages();
    }
}

const fuiToolsComponent = {
    template: fuiToolsTmpl,
    props: {
        callback: Function,
        activeTool: String
    },
    data() {
        return {
            toolsList: ["frame", "box", "line", "dot", "circle", "disc"]
        };
    }
}

const fuiInspectorComponent = {
    template: fuiInspectorTmpl,
    props: {
        elem: Object
    },
    data() {
        return {};
    },
    methods: {
        redrawCanvas() {
            this.$emit("redrawCanvas");
        },
        isHWVisible(elem) {
            // return true;
            return !["line", "str", "dot", "icon", "circle", "disc"].includes(elem.type);
        },
        isRadiusVisible(elem) {
            return ["circle", "disc"].includes(elem.type);
        }
    }
}

const fuiSettingsComponent = {
    template: fuiSettingsTmpl,
    props: {
        isInverted: Boolean,
    },
    data() {
        return {};
    },
    computed: {
        settingsClassNames() {
            return {
                "button_active": this.isInverted,
            };
        },
    },
    methods: {
        toggleInvert() {
            this.$emit("toggleInvert");
            this.$emit("redrawCanvas");
        },
    }
}

const fuiCodeComponent = {
    template: `
    <div class="fui-code">
      <pre>{{ content }}</pre>
    </div>
        `,
    props: {
        content: String
    },
}

const fuiTabsComponent = {
    template: `
    <div class="fui-tabs">
      <div v-for="(tab, idx) in tabs" :key="idx" class="fui-tab" :class="{'fui-tab_active': activeTab === tab}"
        @click="setActiveTab(tab)">{{ tab }}</div>
    </div>
        `,
    props: {
        activeTab: String
    },
    data() {
        return {
            tabs: ["icons", "code"],
        };
    },
    methods: {
        setActiveTab(tab) {
            this.$emit("setActiveTab", tab);
        }
    }
}

const fuiInspectorInputComponent = {
    template: `
    <span v-if="['str','dot'].includes(element.type) && ['width','height'].includes(field)">{{ element[field] }}</span>
    <select class="inspector__select" v-if="field === 'font'" :value="element[field]" @input="onSelect">
      <option v-for="(font, idx) in fontsList" :key="idx" :value="font">{{ font }}</option>
    </select>
    <input v-else class="inspector__input" @input="onInput" :value="element[field]" :type="type" max="128" step="1" />
    `,
    props: {
        element: Object,
        type: String,
        field: String,
        defaultFont: String,
    },
    data() {
        return {
            fontsList: ["FontPrimary", "FontSecondary", "FontBigNumbers"],
        };
    },
    computed: {
        charsRegex() {
            return this.element.font === "FontBigNumbers" ? numberFontsRegex : standardFontsRegex;
        }
    },
    methods: {
        onInput(e) {
            const result = ["text"].includes(this.type) ?
                e.target.value.replace(this.charsRegex, '') :
                parseInt(e.target.value.replace(/[^0-9]/g, ''));
            e.target.value = result;
            this.element[this.field] = result;
            if (["text"].includes(this.field)) {
                this.updateTextWidth();
            }
            this.$emit('redrawCanvas');
        },
        onSelect(e) {
            this.element[this.field] = e.target.value;
            if (["font"].includes(this.field)) {
                this.element.text = this.element.text.replace(this.charsRegex, '').trim();
                this.updateTextWidth();
            }
            this.$emit('redrawCanvas');
        },
        updateTextWidth() {
            // recalculate text draggable area size
            this.element.width = getTextWidth(this.element.text, this.element.font);
            this.element.height = textContainerHeight[this.element.font];
        }
    }
}