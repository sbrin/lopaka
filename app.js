let CTX;

Vue.createApp({
    template: fuiEditorTmpl,
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
            isInverted: false,
        };
    },
    computed: {
        canvasClassNames() {
            return {
                'fui-canvas_select': this.activeTool === 'select',
                'fui-canvas_moving': this.isMoving,
            }
        },
        isEmpty() {
            return this.screenElements.length === 0
        }
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

            if (["frame", "box", "dot", "circle", "disc"].includes(this.activeTool)) {
                this.screenCurrentElement = {
                    type: this.activeTool,
                    x: scaleDown(x),
                    y: scaleDown(y),
                    width: 1,
                    height: 1,
                    radius: 0,
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
                    yy: scaleDown(y) - textContainerHeight[this.defaultFont],
                    index: this.layerIndex,
                    text: "Text string",
                    width: getTextWidth("Text string", this.defaultFont),
                    height: textContainerHeight[this.defaultFont],
                    font: this.defaultFont,
                };
                this.layerIndex += 1;
                this.screenElements.push(this.screenCurrentElement);
            } else {
                // Moving otherwise
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
            const offsetX = scaleDown(e.offsetX);
            const offsetY = scaleDown(e.offsetY);
            if (["line", "frame", "box", "circle", "disc"].includes(this.activeTool)) {
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
                        this.screenCurrentElement.x2 = offsetX;
                        this.screenCurrentElement.y2 = offsetY;
                    }
                    if (["frame", "box"].includes(this.activeTool)) {
                        const width = e.offsetX - this.mouseClick_x;
                        const height = e.offsetY - this.mouseClick_y;
                        this.screenCurrentElement.width = scaleSize(width);
                        this.screenCurrentElement.height = scaleSize(height);
                    }
                    if (["circle", "disc"].includes(this.activeTool)) {
                        let width = e.offsetX - this.mouseClick_x;
                        let height = e.offsetY - this.mouseClick_y;

                        const absWidth = Math.abs(width);
                        const absHeight = Math.abs(height);

                        let diameter = absWidth > absHeight ? absWidth : absHeight;
                        if (width < 0) {
                            this.screenCurrentElement.x = scaleDown(this.mouseClick_x - diameter);
                        }
                        if (height < 0) {
                            this.screenCurrentElement.y = scaleDown(this.mouseClick_y - diameter);
                        }

                        this.screenCurrentElement.width = scaleSize(diameter);
                        this.screenCurrentElement.height = scaleSize(diameter);
                        this.screenCurrentElement.radius = scaleSize(Math.abs(diameter) / 2);
                    }
                }
            } else if (this.activeTool === "dot") {
                this.screenCurrentElement.x = offsetX;
                this.screenCurrentElement.y = offsetY;
            } else {
                x = e.offsetX - this.mouseClick_dx;
                y = e.offsetY - this.mouseClick_dy;
                if (["str"].includes(this.screenCurrentElement.type)) {
                    this.screenCurrentElement.yy = scaleDown(y) - textContainerHeight[this.screenCurrentElement.font];
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
                if (["frame", "box"].includes(this.activeTool)) {
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
            CTX.save();
            CTX.clearRect(0, 0, canvasWidth, canvasHeight);
            for (let i = 0; i < this.screenElements.length; i++) {
                const imgData = CTX.getImageData(
                    0,
                    0,
                    canvasWidth,
                    canvasHeight
                );
                const {
                    name,
                    x,
                    y,
                    x2,
                    y2,
                    width,
                    height,
                    radius,
                    type,
                    text,
                    font
                } = this.screenElements[i];
                if (type === "frame") {
                    CTX.strokeRect(x + 0.5, y + 0.5, width, height);
                } else if (type === "box") {
                    CTX.fillRect(x, y, width, height);
                } else if (type === "dot") {
                    CTX.fillRect(x, y, 1, 1);
                } else if (type === "icon") {
                    CTX.drawImage(this.fuiImages[name].element, x, y);
                } else if (type === "line") {
                    bline(imgData, x, y, x2, y2);
                    CTX.putImageData(imgData, 0, 0);
                } else if (type === "circle") {
                    drawCircle(imgData, x + radius, y + radius, radius);
                    CTX.putImageData(imgData, 0, 0);
                } else if (type === "disc") {
                    drawDisc(imgData, x + radius, y + radius, radius);
                    CTX.putImageData(imgData, 0, 0);
                } else if (type === "str") {
                    if (font === "FontBigNumbers") {
                        drawBigNumbers(imgData, x, y - 16, text);
                        CTX.putImageData(imgData, 0, 0);
                    } else {
                        const fontSize = fontSizes[font];
                        CTX.font = `${fontSize}px ${font}`;
                        CTX.fillText(text, x, y);
                    }
                }
            }
            const newImgData = maskBlack(CTX, this.isInverted);
            CTX.putImageData(newImgData, 0, 0);
            CTX.restore();
            this.codePreview = generateCode(this.screenElements, this.isInverted);
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
        toggleInvert() {
            this.isInverted = !this.isInverted;
        }
    },
    mounted() {
        CTX = this.$refs.screen.getContext("2d");
        CTX.strokeWidth = 1;
        CTX.textRendering = "optimizeSpeed";

        document.addEventListener("mouseup", this.canvasMouseUp);
    }
})
    .component("fui-layers", fuiLayersComponent)
    .component("fui-button", fuiButtonComponent)
    .component("fui-icons", fuiIconsComponent)
    .component("fui-tools", fuiToolsComponent)
    .component("fui-inspector", fuiInspectorComponent)
    .component("fui-settings", fuiSettingsComponent)
    .component("fui-code", fuiCodeComponent)
    .component("fui-tabs", fuiTabsComponent)
    .component("fui-inspector-input", fuiInspectorInputComponent)
    .mount("#fuigen_app");