Vue.createApp({
    template: "#fui-editor",
    data() {
        return {
            layerIndex: 1,
            fuiImages: {},
            customImages: [],
            codePreview: "",
            screenElements: [],
            screenCurrentElement: null,
            mouseClick_x: 0,
            mouseClick_y: 0,
            mouseClick_dx: 0,
            mouseClick_dy: 0,
            oX: 0,
            oY: 0,
            activeTool: "frame",
            mainTab: "icons",
            isDrawing: false,
            isMoving: false,
            defaultFont: "FontPrimary",
            fontSizes: {
                FontPrimary: "10",
                FontSecondary: "16",
            }
        };
    },
    computed: {
        canvasClassNames() {
            return {
                'fui-canvas_select': this.activeTool === 'select',
                'fui-canvas_moving': this.isMoving,
            }
        },
    },
    methods: {
        setMainTab(tab) {
            this.mainTab = tab;
        },
        prepareImages(e) {
            this.fuiImages = e;
        },
        setActiveTool(tool) {
            this.activeTool = tool;
        },
        setCurrentItem(item) {
            this.screenCurrentElement = item;
        },
        removeLayer(index) {
            this.screenCurrentElement = undefined;
            this.screenElements = this.screenElements.filter(
                (item) => item.index !== index
            );
            this.redrawCanvas();
        },
        addImageToCanvas(name, x = 32, y = 16) {
            this.screenElements.push({
                type: "icon",
                custom: this.fuiImages[name].custom,
                x: x,
                y: y,
                width: this.fuiImages[name].width,
                height: this.fuiImages[name].height,
                name: name,
                index: this.layerIndex,
            });
            this.screenCurrentElement = this.screenElements.find(item => item.index === this.layerIndex);
            this.layerIndex += 1;
            this.redrawCanvas();
            this.activeTool = "select";
        },
        async canvasOnDrop(e) {
            e.preventDefault();
            e.stopPropagation();
            const [offsetSrcImgX, offsetSrcImgY] = e.dataTransfer.getData("offset")
                ? e.dataTransfer.getData("offset").split(",")
                : [0, 0];
            const offsetTargetX = scaleDown(e.offsetX - offsetSrcImgX);
            const offsetTargetY = scaleDown(e.offsetY - offsetSrcImgY);
            let name = e.dataTransfer.getData("name");

            if (!name) {
                const file = e.dataTransfer.files[0];
                name = file.name.substr(0, file.name.lastIndexOf('.')) || file.name; // remove file extension
                const fileResult = await readFileAsync(file);
                const image = await loadImageAsync(fileResult);
                if (!this.fuiImages[name]) {
                    this.fuiImages[name] = {
                        width: image.width,
                        height: image.height,
                        element: image,
                        custom: true,
                    };
                    this.customImages = [...this.customImages, {
                        name: name,
                        width: image.width,
                        height: image.height,
                        element: image,
                        src: image.src,
                        custom: true,
                    }];
                }
            }
            this.addImageToCanvas(name, offsetTargetX, offsetTargetY);
        },
        canvasMouseDown(e) {
            e.preventDefault();
            if (e.button !== 0) {
                return;
            }
            const [x, y] = [e.offsetX, e.offsetY];
            this.mouseClick_x = x - (x % 4);
            this.mouseClick_y = y - (y % 4);
            this.screenCurrentElement = undefined;
            this.isDrawing = true;

            if (["frame", "box", "dot"].includes(this.activeTool)) {
                this.screenCurrentElement = {
                    type: this.activeTool,
                    x: scaleDown(x),
                    y: scaleDown(y),
                    width: 1,
                    height: 1,
                    index: this.layerIndex
                };
                this.layerIndex += 1;
                this.screenElements.push(this.screenCurrentElement);
            } else if (this.activeTool === "line") {
                this.screenCurrentElement = {
                    type: this.activeTool,
                    x: scaleDown(x),
                    y: scaleDown(y),
                    x2: scaleDown(x),
                    y2: scaleDown(y),
                    width: 0,
                    height: 0,
                    index: this.layerIndex
                };
                this.layerIndex += 1;
                this.screenElements.push(this.screenCurrentElement);
            } else if (this.activeTool === "str") {
                this.screenCurrentElement = {
                    type: this.activeTool,
                    x: scaleDown(x),
                    y: scaleDown(y),
                    yy: scaleDown(y) - 8,
                    index: this.layerIndex,
                    text: "Text string",
                    width: 50,
                    height: 8,
                    font: this.defaultFont,
                };
                this.layerIndex += 1;
                this.screenElements.push(this.screenCurrentElement);
            } else {
                const current = getElementByOffset(this.screenElements, x, y);
                if (current) {
                    this.isMoving = true;
                    this.screenCurrentElement = current;
                    const currentX = scaleUp(this.screenCurrentElement.x);
                    const currentY = scaleUp(this.screenCurrentElement.y);
                    this.mouseClick_dx = this.mouseClick_x - currentX;
                    this.mouseClick_dy = this.mouseClick_y - currentY;
                }
            }
        },
        canvasMouseMove(e) {
            e.preventDefault();
            if (!this.screenCurrentElement || !this.isDrawing) {
                return;
            }
            let x =
                this.mouseClick_x > canvasBoundX ? canvasBoundX : this.mouseClick_x;
            let y =
                this.mouseClick_y > canvasBoundY ? canvasBoundY : this.mouseClick_y;
            if (["line", "frame", "box"].includes(this.activeTool)) {
                if (
                    e.offsetX >= 0 &&
                    e.offsetY >= 0 &&
                    e.offsetX < canvasBoundX &&
                    e.offsetY < canvasBoundY
                ) {
                    if (this.activeTool === "frame") {
                        x = x >= canvasBoundX - 4 ? canvasBoundX - 4 : x;
                        y = y >= canvasBoundY - 4 ? canvasBoundY - 4 : y;
                    }
                    this.screenCurrentElement.x = scaleDown(x);
                    this.screenCurrentElement.y = scaleDown(y);

                    if (["line"].includes(this.activeTool)) {
                        this.screenCurrentElement.x2 = scaleDown(e.offsetX);
                        this.screenCurrentElement.y2 = scaleDown(e.offsetY);
                    }
                    if (["frame", "box"].includes(this.activeTool)) {
                        const width = e.offsetX - this.mouseClick_x;
                        const height = e.offsetY - this.mouseClick_y;
                        this.screenCurrentElement.width = scaleSize(width);
                        this.screenCurrentElement.height = scaleSize(height);
                    }
                }
            } else if (this.activeTool === "dot") {
                this.screenCurrentElement.x = scaleDown(e.offsetX);
                this.screenCurrentElement.y = scaleDown(e.offsetY);
            } else {
                x = e.offsetX - this.mouseClick_dx;
                y = e.offsetY - this.mouseClick_dy;
                if (["str"].includes(this.screenCurrentElement.type)) {
                    this.screenCurrentElement.yy = scaleDown(y) - 8;
                }
                if (["line"].includes(this.screenCurrentElement.type)) {
                    const {
                        x: x1,
                        y: y1,
                        x2,
                        y2
                    } = this.screenCurrentElement;
                    const width = Math.abs(x2 - x1);
                    const height = Math.abs(y2 - y1);
                    if (x2 > x1) {
                        this.screenCurrentElement.x2 = scaleDown(x) + width;
                    } else {
                        this.screenCurrentElement.x2 = scaleDown(x) - width;
                    }
                    if (y2 > y1) {
                        this.screenCurrentElement.y2 = scaleDown(y) + height;
                    } else {
                        this.screenCurrentElement.y2 = scaleDown(y) - height;
                    }
                }
                this.screenCurrentElement.x = scaleDown(x);
                this.screenCurrentElement.y = scaleDown(y);
            }
            this.redrawCanvas();
        },
        canvasMouseLeave(e) {
            e.preventDefault();
            if (this.activeTool === "select") {
                this.isDrawing = false;
                this.stopDrawing(e);
            }
            this.isMoving = false;
        },
        canvasMouseUp(e) {
            if (this.isDrawing) {
                e.preventDefault();
                this.stopDrawing(e);
                this.redrawCanvas();
            }
            this.isMoving = false;
            this.isDrawing = false;
        },
        stopDrawing() {
            if (this.screenCurrentElement) {
                if (this.activeTool === "frame" || this.activeTool === "box") {
                    if (this.screenCurrentElement.width < 0) {
                        this.screenCurrentElement.width = Math.abs(
                            this.screenCurrentElement.width
                        );
                        this.screenCurrentElement.x -= this.screenCurrentElement.width;
                    }
                    if (this.screenCurrentElement.height < 0) {
                        this.screenCurrentElement.height = Math.abs(
                            this.screenCurrentElement.height
                        );
                        this.screenCurrentElement.y -= this.screenCurrentElement.height;
                    }
                }
            }
        },
        redrawCanvas() {
            this.ctx.save();
            this.ctx.clearRect(0, 0, canvasWidth, canvasHeight);
            for (let i = 0; i < this.screenElements.length; i++) {
                const {
                    name,
                    x,
                    y,
                    x2,
                    y2,
                    width,
                    height,
                    type,
                    text,
                    font
                } = this.screenElements[i];
                if (type === "frame") {
                    this.ctx.strokeRect(x + 0.5, y + 0.5, width, height);
                } else if (type === "box") {
                    this.ctx.fillRect(x, y, width, height);
                } else if (type === "dot") {
                    this.ctx.fillRect(x, y, 1, 1);
                } else if (type === "icon") {
                    this.ctx.drawImage(this.fuiImages[name].element, x, y);
                } else if (type === "line") {
                    const imgData = this.ctx.getImageData(
                        0,
                        0,
                        canvasWidth,
                        canvasHeight
                    );
                    bline(imgData, x, y, x2, y2);
                    this.ctx.putImageData(imgData, 0, 0);
                } else if (type === "str") {
                    const fontSize = this.fontSizes[font];
                    this.ctx.font = `${fontSize}px ${font}`;
                    this.ctx.fillText(text, x, y);
                }
            }
            const imgData = this.ctx.getImageData(0, 0, canvasWidth, canvasHeight);
            const newImgData = maskBlack(imgData);
            this.ctx.putImageData(newImgData, 0, 0);
            this.ctx.restore();
            this.codePreview = generateCode(this.screenElements);
        },
        resetScreen() {
            this.screenElements = [];
            this.redrawCanvas();
            this.codePreview = "";
            this.screenCurrentElement = undefined;
        },
        copyCode() {
            navigator.clipboard.writeText(this.codePreview);
        },
        cleanCustomIcons() {
            this.customImages = [];
            this.screenElements = this.screenElements.filter(item => !item.custom);
            this.redrawCanvas();
            if (this.screenCurrentElement && this.screenCurrentElement.custom) {
                this.screenCurrentElement = undefined;
            }
        },
        getLayerListItem(item) {
            return getLayerListItem(item);
        }
    },
    mounted() {
        this.ctx = this.$refs.screen.getContext("2d");
        this.ctx.strokeWidth = 1;
        this.ctx.textRendering = "optimizeSpeed";

        document.addEventListener("mouseup", this.canvasMouseUp);
    }
})
    .component("fui-button", {
        template: "#fui-button",
        props: {
            title: String,
            active: Boolean
        }
    })
    .component("fui-icons", {
        template: "#fui-icons",
        data() {
            return {
                imagesSrc: [],
            };
        },
        props: {
            customImages: Array,
        },
        watch: {
            customImages: function (newVal) {
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
        mounted() {
            this.prepareImages();
        }
    })
    .component("fui-tools", {
        template: "#fui-tools",
        props: {
            callback: Function,
            activeTool: String
        },
        data() {
            return {
                toolsList: ["frame", "box", "line", "dot"]
            };
        }
    })
    .component("fui-inspector", {
        template: "#fui-inspector",
        props: {
            elem: Object
        },
        data() {
            return {};
        },
        methods: {
            redrawCanvas() {
                this.$emit('redrawCanvas');
            },
            isHWVisible(elem) {
                return !['line', 'str', 'dot', 'icon'].includes(elem.type);
            }
        }
    })
    .component("fui-code", {
        template: "#fui-code",
        props: {
            content: String
        },
    })
    .component("fui-tabs", {
        template: "#fui-tabs",
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
    })
    .component("fui-inspector-input", {
        template: "#fui-inspector-input",
        props: {
            element: Object,
            type: String,
            field: String,
            defaultFont: String,
        },
        data() {
            return {
                fontsList: ["FontPrimary", "FontSecondary"],
            };
        },
        methods: {
            onInput(e) {
                const result = ["text"].includes(this.type) ?
                    e.target.value.replace(/[^0-9a-zA-Z\s\!\"\.\#\$\%\&\'\(\)\*\+\,\-\.\/]/g, '') :
                    parseInt(e.target.value.replace(/[^0-9]/g, ''));
                e.target.value = result;
                this.element[this.field] = result;
                this.$emit('redrawCanvas');
            },
            onSelect(e) {
                this.element[this.field] = e.target.value;
                this.$emit('redrawCanvas');
            }
        }
    })
    .mount("#fuigen_app");