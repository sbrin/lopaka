const fuiCanvasComponent = {
    template: `<div class="canvas-wrapper">
    <div class="fui-grid">
        <canvas id="screen"
            :width="canvasWidth"
            :height="canvasHeight"
            :style="style"
            ref="screen"
            :class="canvasClassNames"
            @mousedown="canvasMouseDown"
            @mousemove="canvasMouseMove"
            @mouseleave="canvasMouseLeave"
            @dragover="(e) => { e.preventDefault() }"
            @drop="canvasOnDrop"
            @resize="redrawCanvas"
        />
        </div>
    </div>`,
    props: {
        display: String,
        layerIndex: Number,
        activeTool: String,
        screenElements: Array,
        currentLayer: Object,
        fuiImages: Array,
    },
    data() {
        return {
            // canvasSize: [0, 0],
            CTX: undefined,
            mouseClick_x: 0,
            mouseClick_y: 0,
            mouseClick_dx: 0,
            mouseClick_dy: 0,
            oX: 0,
            oY: 0,
            isMoving: false,
            isDrawing: false,
        }
    },
    // watch: {
    //     canvasSize() {

    //     }
    // },
    computed: {
        canvasSize() {
            return this.display.split("×");
        },
        canvasClassNames() {
            return {
                'fui-canvas_select': this.activeTool === 'select',
                'fui-canvas_moving': this.isMoving,
            }
        },
        canvasWidth() {
            return parseInt(this.canvasSize[0]);
        },
        canvasHeight() {
            return parseInt(this.canvasSize[1]);
        },
        canvasBoundX() {
            return this.canvasWidth * 4
        },
        canvasBoundY() {
            return this.canvasHeight * 4
        },
        style() {
            return `width: ${this.canvasBoundX}px; height: ${this.canvasBoundY}px;`
        }
    },
    mounted() {
        this.CTX = this.$refs.screen.getContext("2d", { willReadFrequently: true });
        // this.CTX.canvas.width = this.canvasWidth;
        // this.CTX.canvas.height = this.canvasHeight;

        this.CTX.strokeWidth = 1;
        this.CTX.textRendering = "optimizeSpeed";

        document.addEventListener("mouseup", this.canvasMouseUp);

        this.redrawCanvas(this.screenElements);
    },
    unmounted() {
        document.removeEventListener("mouseup", this.canvasMouseUp);
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
            } else if (this.activeTool === "line") {
                this.$emit("updateCurrentLayer", {
                    ...layerProps,
                    x2: scaleDown(x),
                    y2: scaleDown(y),
                    width: 0,
                    height: 0,
                });
                this.$emit("addScreenLayer");
            } else if (this.activeTool === "str") {
                this.$emit("updateCurrentLayer", {
                    ...layerProps,
                    yy: scaleDown(y) - textContainerHeight[defaultFont],
                    text: "Text string 123",
                    width: getTextWidth("Text string", defaultFont),
                    height: textContainerHeight[defaultFont],
                    font: defaultFont,
                });
                this.$emit("addScreenLayer");
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
                this.mouseClick_x > this.canvasBoundX ? this.canvasBoundX : this.mouseClick_x;
            let y =
                this.mouseClick_y > this.canvasBoundY ? this.canvasBoundY : this.mouseClick_y;
            const offsetX = scaleDown(e.offsetX);
            const offsetY = scaleDown(e.offsetY);
            const layerProps = {};
            if (["line", "frame", "box", "circle", "disc"].includes(this.activeTool)
                && (
                    e.offsetX >= 0 &&
                    e.offsetY >= 0 &&
                    e.offsetX < this.canvasBoundX &&
                    e.offsetY < this.canvasBoundY
                )
            ) {
                if (this.activeTool === "frame") {
                    x = x >= this.canvasBoundX - 4 ? this.canvasBoundX - 4 : x;
                    y = y >= this.canvasBoundY - 4 ? this.canvasBoundY - 4 : y;
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
            if (this.isDrawing || this.isMoving) {
                this.$emit("updateCode");
            }
            this.isMoving = false;
            this.isDrawing = false;
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
            this.$emit("setActiveTool", "select");
            this.$emit("updateCode");
        },
        redrawCanvas(screenElements) {
            this.CTX.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
            this.CTX.save();
            for (let screenElement of screenElements) {
                const imgData = this.CTX.getImageData(
                    0,
                    0,
                    this.canvasWidth,
                    this.canvasHeight
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
                    this.CTX.strokeRect(x + 0.5, y + 0.5, width, height);
                } else if (type === "box") {
                    this.CTX.fillRect(x, y, width, height);
                } else if (type === "dot") {
                    this.CTX.fillRect(x, y, 1, 1);
                } else if (type === "icon") {
                    this.CTX.drawImage(this.fuiImages[name].element, x, y);
                } else if (type === "line") {
                    bline(imgData, x, y, x2, y2, this.canvasWidth, this.canvasHeight);
                    this.CTX.putImageData(imgData, 0, 0);
                } else if (type === "circle") {
                    drawCircle(imgData, x + radius, y + radius, radius, this.canvasWidth, this.canvasHeight);
                    this.CTX.putImageData(imgData, 0, 0);
                } else if (type === "disc") {
                    drawDisc(imgData, x + radius, y + radius, radius, this.canvasWidth, this.canvasHeight);
                    this.CTX.putImageData(imgData, 0, 0);
                } else if (type === "str") {
                    const fontSize = fontSizes[font];
                    this.CTX.font = `${fontSize}px "${font}"`;
                    this.CTX.fillText(text, x, y);
                }
            }
            const newImgData = maskBlack(this.CTX, this.isInverted, this.canvasWidth, this.canvasHeight);
            this.CTX.putImageData(newImgData, 0, 0);
            this.CTX.restore();
        },
    }
}
