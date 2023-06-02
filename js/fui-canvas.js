const fuiCanvasComponent = {
    template: `<div class="canvas-wrapper">
          <canvas id="screen" width="128" height="64" ref="screen" :class="canvasClassNames"
            @mousedown="canvasMouseDown"
            @mousemove="canvasMouseMove"
            @mouseleave="canvasMouseLeave"
            @dragover="(e) => { e.preventDefault() }"
            @drop="canvasOnDrop"
        />
        </div>`,
    props: {
        activeTool: String,
        screenElements: Array,
        currentLayer: Object,
        fuiImages: Array,
    },
    data() {
        return {
            mouseClick_x: 0,
            mouseClick_y: 0,
            mouseClick_dx: 0,
            mouseClick_dy: 0,
            oX: 0,
            oY: 0,
            layerIndex: 1,
            isMoving: false,
            isDrawing: false,
        }
    },
    computed: {
        canvasClassNames() {
            return {
                'fui-canvas_select': this.activeTool === 'select',
                'fui-canvas_moving': this.isMoving,
            }
        },
    },
    mounted() {
        CTX = this.$refs.screen.getContext("2d", { willReadFrequently: true });
        CTX.strokeWidth = 1;
        CTX.textRendering = "optimizeSpeed";

        document.addEventListener("mouseup", this.canvasMouseUp);
    },
    methods: {
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
                this.$emit("updateFuiImages", {
                    name: name,
                    width: image.width,
                    height: image.height,
                    element: image,
                    isCustom: true,
                });
            }
            this.addImageToCanvas(name, offsetTargetX, offsetTargetY);
        },
        canvasMouseDown(e) {
            e.preventDefault();
            if (e.button !== 0) {
                return;
            }
            this.$emit("updateCurrentLayer", undefined);
            const [x, y] = [e.offsetX, e.offsetY];
            this.mouseClick_x = x - (x % 4);
            this.mouseClick_y = y - (y % 4);
            this.isDrawing = true;

            const layerProps = {
                name: "",
                type: this.activeTool,
                index: this.layerIndex,
                x: scaleDown(x),
                y: scaleDown(y),
            };

            if (["frame", "box", "dot", "circle", "disc"].includes(this.activeTool)) {
                this.$emit("updateCurrentLayer", {
                    ...layerProps,
                    width: 1,
                    height: 1,
                    radius: 0,
                });
                this.$emit("addScreenLayer");
                this.layerIndex += 1;
            } else if (this.activeTool === "line") {
                this.$emit("updateCurrentLayer", {
                    ...layerProps,
                    x2: scaleDown(x),
                    y2: scaleDown(y),
                    width: 0,
                    height: 0,
                });
                this.$emit("addScreenLayer");
                this.layerIndex += 1;
            } else if (this.activeTool === "str") {
                this.$emit("updateCurrentLayer", {
                    ...layerProps,
                    yy: scaleDown(y) - textContainerHeight[defaultFont],
                    text: "Text string",
                    width: getTextWidth("Text string", defaultFont),
                    height: textContainerHeight[defaultFont],
                    font: defaultFont,
                });
                this.$emit("addScreenLayer");
                this.layerIndex += 1;
            } else {
                // Moving otherwise
                const current = getElementByOffset(this.screenElements, x, y);
                if (current) {
                    this.isMoving = true;
                    this.$emit("updateCurrentLayer", current);
                    const currentX = scaleUp(current.x);
                    const currentY = scaleUp(current.y);
                    this.mouseClick_dx = this.mouseClick_x - currentX;
                    this.mouseClick_dy = this.mouseClick_y - currentY;
                }
            }
        },
        canvasMouseMove(e) {
            e.preventDefault();
            if (!this.currentLayer || !this.isDrawing) {
                return;
            }
            let x =
                this.mouseClick_x > canvasBoundX ? canvasBoundX : this.mouseClick_x;
            let y =
                this.mouseClick_y > canvasBoundY ? canvasBoundY : this.mouseClick_y;
            const offsetX = scaleDown(e.offsetX);
            const offsetY = scaleDown(e.offsetY);
            const layerProps = {};
            if (["line", "frame", "box", "circle", "disc"].includes(this.activeTool)
                && (
                    e.offsetX >= 0 &&
                    e.offsetY >= 0 &&
                    e.offsetX < canvasBoundX &&
                    e.offsetY < canvasBoundY
                )
            ) {
                if (this.activeTool === "frame") {
                    x = x >= canvasBoundX - 4 ? canvasBoundX - 4 : x;
                    y = y >= canvasBoundY - 4 ? canvasBoundY - 4 : y;
                }

                if (["line"].includes(this.activeTool)) {
                    layerProps.x2 = offsetX;
                    layerProps.y2 = offsetY;
                }
                if (["frame", "box"].includes(this.activeTool)) {
                    const width = e.offsetX - this.mouseClick_x;
                    const height = e.offsetY - this.mouseClick_y;
                    layerProps.width = scaleSize(width);
                    layerProps.height = scaleSize(height);
                }
                if (["circle", "disc"].includes(this.activeTool)) {
                    let width = e.offsetX - this.mouseClick_x;
                    let height = e.offsetY - this.mouseClick_y;

                    const absWidth = Math.abs(width);
                    const absHeight = Math.abs(height);

                    let diameter = absWidth > absHeight ? absWidth : absHeight;
                    if (width < 0) {
                        layerProps.x = scaleDown(this.mouseClick_x - diameter);
                    }
                    if (height < 0) {
                        layerProps.y = scaleDown(this.mouseClick_y - diameter);
                    }

                    layerProps.width = scaleSize(diameter);
                    layerProps.height = scaleSize(diameter);
                    layerProps.radius = scaleSize(Math.abs(diameter) / 2);
                } else {
                    layerProps.x = scaleDown(x);
                    layerProps.y = scaleDown(y);
                }
            } else if (this.activeTool === "dot") {
                layerProps.x = offsetX;
                layerProps.y = offsetY;
            } else {
                x = e.offsetX - this.mouseClick_dx;
                y = e.offsetY - this.mouseClick_dy;
                // moving text and line layers
                if (["str"].includes(this.currentLayer.type)) {
                    layerProps.yy = scaleDown(y) - textContainerHeight[this.currentLayer.font];
                }
                if (["line"].includes(this.currentLayer.type)) {
                    const {
                        x: x1,
                        y: y1,
                        x2,
                        y2
                    } = this.currentLayer;
                    const width = Math.abs(x2 - x1);
                    const height = Math.abs(y2 - y1);
                    if (x2 > x1) {
                        layerProps.x2 = scaleDown(x) + width;
                    } else {
                        layerProps.x2 = scaleDown(x) - width;
                    }
                    if (y2 > y1) {
                        layerProps.y2 = scaleDown(y) + height;
                    } else {
                        layerProps.y2 = scaleDown(y) - height;
                    }
                }
                // moving the rest
                layerProps.x = scaleDown(x);
                layerProps.y = scaleDown(y);
            }
            this.$emit("updateCurrentLayer", layerProps);
            this.redrawCanvas(this.screenElements);
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
                this.redrawCanvas(this.screenElements);
            }
            this.isMoving = false;
            this.isDrawing = false;
            this.$emit("updateCode");
        },
        stopDrawing() {
            if (this.currentLayer) {
                if (["frame", "box"].includes(this.activeTool)) {
                    const layerProps = {};
                    if (this.currentLayer.width < 0) {
                        layerProps.width = Math.abs(
                            this.currentLayer.width
                        );
                        layerProps.x = this.currentLayer.x - layerProps.width;
                    }
                    if (this.currentLayer.height < 0) {
                        layerProps.height = Math.abs(
                            this.currentLayer.height
                        );
                        layerProps.y = this.currentLayer.y - layerProps.height;
                    }
                    this.$emit("updateCurrentLayer", layerProps);
                }
            }
            this.$emit("updateCode");
        },
        addImageToCanvas(name, x = 32, y = 16) {
            const { isCustom, width, height } = this.fuiImages[name];
            const layer = {
                type: "icon",
                isCustom: isCustom,
                x: x,
                y: y,
                width: width,
                height: height,
                name: name,
                index: this.layerIndex,
            };
            this.$emit("updateCurrentLayer", layer);
            this.$emit("addScreenLayer", layer);
            this.layerIndex += 1;
            this.$emit("setActiveTool", "select");
            this.$emit("updateCode");
        },
        redrawCanvas(screenElements) {
            CTX.clearRect(0, 0, canvasWidth, canvasHeight);
            CTX.save();
            for (let screenElement of screenElements) {
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
                } = screenElement;
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
                    const fontSize = fontSizes[font];
                    CTX.font = `${fontSize}px "${font}"`;
                    CTX.fillText(text, x, y);
                }
            }
            const newImgData = maskBlack(CTX, this.isInverted);
            CTX.putImageData(newImgData, 0, 0);
            CTX.restore();
        },
    }
}
