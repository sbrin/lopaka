<script lang="ts" setup>
import {
  DEFAULT_STRING,
  KEYS,
  fontMap,
  textContainerHeight,
} from "../../const";
import {
  drawCircle,
  drawDisc,
  drawLine,
  drawTextWithMasking,
  imgToCanvasData,
  maskAndMixImageData,
  putImageDataWithAlpha,
  startDrawing,
} from "../../graphics";
import {
  generateUID,
  getElementByOffset,
  getTextWidth,
  loadImageAsync,
  readFileAsync,
  scaleDown,
  scaleSize,
  scaleUp,
} from "../../utils";
import { computed, defineProps, onBeforeUnmount, onMounted, ref } from "vue";

type TLayerProp = {
  name?: string;
  type?: string;
  index?: number;
  x?: number;
  y?: number;
  x2?: number;
  y2?: number;
  width?: number;
  height?: number;
  radius?: number;
  yy?: number;
  text?: string;
  font?: string;
  id?: string;
  isOverlay?: boolean;
  isCustom?: boolean;
};

const props = defineProps<{
  display: string;
  layerIndex: number;
  activeTool: string;
  screenElements: any[];
  currentLayer: any;
  fuiImages: any;
  imageDataCache: any;
  library: string;
}>();

const emit = defineEmits([
  "updateCode",
  "updateCurrentLayer",
  "addScreenLayer",
  "setActiveTool",
  "updateFuiImages",
  "saveLayers",
]);

const screen = ref(null);

defineExpose({
  redrawCanvas,
  addImageToCanvas,
  screen,
});

let ctx: CanvasRenderingContext2D,
  imageCanvasCTX,
  mouseClick_x = 0,
  mouseClick_y = 0,
  mouseClick_dx = 0,
  mouseClick_dy = 0,
  oX = 0,
  oY = 0;
const isMoving = ref(false),
  isDrawing = ref(false),
  isEraser = ref(false),
  scale = ref(4);
// computed
const canvasSize = computed(() => {
  return props.display.split("×");
});
const canvasClassNames = computed(() => {
  return {
    "fui-canvas_select": props.activeTool === "select",
    "fui-canvas_moving": isMoving.value,
    "fui-canvas_draw": props.activeTool === "draw",
  };
});
const canvasWidth = computed(() => {
  return parseInt(canvasSize.value[0]);
});
const canvasHeight = computed(() => {
  return parseInt(canvasSize.value[1]);
});
const canvasBoundX = computed(() => {
  return canvasWidth.value * scale.value;
});
const canvasBoundY = computed(() => {
  return canvasHeight.value * scale.value;
});
const style = computed(() => {
  return `width: ${canvasBoundX.value}px; height: ${canvasBoundY.value}px;`;
});
const defaultFont = computed(() => {
  return fontMap[props.library].default;
});
onMounted(() => {
  ctx = screen.value.getContext("2d", {
    willReadFrequently: true,
    antialias: false,
  });
  ctx.imageSmoothingEnabled = false;
  ctx["mozImageSmoothingEnabled"] = false;
  ctx.lineWidth = 1;
  ctx["textRendering"] = "optimizeSpeed";
  document.addEventListener("mouseup", canvasMouseUp);
  screen.value.addEventListener("contextmenu", (event) => {
    if (isDrawing.value || isMoving.value || props.activeTool === "draw") {
      event.preventDefault();
    }
  });
  document.addEventListener("keydown", keyDownHandler);
  redrawCanvas(props.screenElements);
  emit("updateCode");
});

onBeforeUnmount(() => {
  document.removeEventListener("mouseup", canvasMouseUp);
  document.removeEventListener("keydown", keyDownHandler);
});

// methods
async function canvasOnDrop(e) {
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
    name = file.name.substr(0, file.name.lastIndexOf(".")) || file.name; // remove file extension
    const fileResult = await readFileAsync(file);
    const image = await loadImageAsync(fileResult);
    emit("updateFuiImages", {
      name: name,
      width: image.width,
      height: image.height,
      element: image,
      isCustom: true,
    });
  }
  addImageToCanvas(name, offsetTargetX, offsetTargetY);
}

function canvasMouseDown(e) {
  e.preventDefault();
  const isRightClickDrawing = props.activeTool === "draw" && e.button === 2;
  if (
    (e.button !== 0 && !isRightClickDrawing) ||
    isDrawing.value ||
    isMoving.value
  ) {
    return;
  }
  const [x, y] = [e.offsetX, e.offsetY];
  oX = scaleDown(x);
  oY = scaleDown(y);
  mouseClick_x = x - (x % scale.value);
  mouseClick_y = y - (y % scale.value);
  isDrawing.value = true;
  isEraser.value = e.button === 2;

  if (
    (props.currentLayer && props.currentLayer.type !== "draw") ||
    props.activeTool === "select"
  ) {
    emit("updateCurrentLayer", null);
  }
  const uid = generateUID();
  let layerProps = {
    name: `${props.activeTool}_${uid}`,
    type: props.activeTool,
    index: props.layerIndex,
    x: scaleDown(x),
    y: scaleDown(y),
    id: uid,
  };

  if (["draw"].includes(props.activeTool)) {
    const isDrawingCurrent =
      !!props.currentLayer && props.currentLayer.type === "draw";

    layerProps = startDrawing(
      isDrawingCurrent,
      layerProps,
      props.currentLayer,
      canvasWidth.value,
      canvasHeight.value,
      oX,
      oY,
      isEraser.value,
      props.imageDataCache
    );

    emit("updateCurrentLayer", layerProps);
    if (!isDrawingCurrent) {
      emit("addScreenLayer", layerProps);
    }
  } else if (
    ["frame", "box", "dot", "circle", "disc"].includes(props.activeTool)
  ) {
    emit("updateCurrentLayer", {
      ...layerProps,
      width: 1,
      height: 1,
      radius: 0,
    });
    emit("addScreenLayer");
  } else if (props.activeTool === "line") {
    emit("updateCurrentLayer", {
      ...layerProps,
      x2: scaleDown(x),
      y2: scaleDown(y),
      width: 0,
      height: 0,
    });
    emit("addScreenLayer");
  } else if (props.activeTool === "str") {
    emit("updateCurrentLayer", {
      ...layerProps,
      yy: scaleDown(y) - textContainerHeight[defaultFont.value],
      text: DEFAULT_STRING,
      width: getTextWidth(DEFAULT_STRING, defaultFont.value),
      height: textContainerHeight[defaultFont.value],
      font: defaultFont.value,
    });
    emit("addScreenLayer");
    emit("setActiveTool", "select");
  } else {
    // Moving otherwise
    const current = getElementByOffset(props.screenElements, x, y);
    if (current) {
      isMoving.value = true;
      emit("updateCurrentLayer", current);
      const currentX = scaleUp(current.x);
      const currentY = scaleUp(current.y);
      mouseClick_dx = mouseClick_x - currentX;
      mouseClick_dy = mouseClick_y - currentY;
    }
  }
}

function canvasMouseMove(e) {
  // this.$refs.cursor.style.transform = `translate3d(${scaleDown(e.clientX) * this.scale}px, ${scaleDown(e.clientY) * this.scale + 2}px, 0)`;
  e.preventDefault();
  if (!props.currentLayer || !isDrawing.value) {
    return;
  }
  let x = mouseClick_x > canvasBoundX.value ? canvasBoundX.value : mouseClick_x;
  let y = mouseClick_y > canvasBoundY.value ? canvasBoundY.value : mouseClick_y;
  const offsetX = scaleDown(e.offsetX);
  const offsetY = scaleDown(e.offsetY);
  const layerProps: TLayerProp = {};

  if (
    ["line", "frame", "box", "circle", "disc", "str"].includes(
      props.activeTool
    ) &&
    e.offsetX >= 0 &&
    e.offsetY >= 0 &&
    e.offsetX < canvasBoundX.value &&
    e.offsetY < canvasBoundY.value
  ) {
    if (props.activeTool === "frame") {
      x =
        x >= canvasBoundX.value - scale.value
          ? canvasBoundX.value - scale.value
          : x;
      y =
        y >= canvasBoundY.value - scale.value
          ? canvasBoundY.value - scale.value
          : y;
    }
    if (["line"].includes(props.activeTool)) {
      layerProps.x2 = offsetX;
      layerProps.y2 = offsetY;
      if (e.shiftKey) {
        if (Math.abs(oX - offsetX) < Math.abs(oY - offsetY)) {
          layerProps.x2 = oX;
        } else {
          layerProps.y2 = oY;
        }
      }
    } else if (["frame", "box"].includes(props.activeTool)) {
      let width = e.offsetX - mouseClick_x;
      let height = e.offsetY - mouseClick_y;
      if (e.shiftKey) {
        if (Math.abs(width) > Math.abs(height)) {
          height = Math.sign(height) * Math.abs(width);
        } else {
          width = Math.sign(width) * Math.abs(height);
        }
      }
      layerProps.width = scaleSize(width);
      layerProps.height = scaleSize(height);
    } else if (["circle", "disc"].includes(props.activeTool)) {
      let width = e.offsetX - mouseClick_x;
      let height = e.offsetY - mouseClick_y;

      const absWidth = Math.abs(width);
      const absHeight = Math.abs(height);

      let diameter = absWidth > absHeight ? absWidth : absHeight;
      if (width < 0) {
        layerProps.x = scaleDown(mouseClick_x - diameter);
      }
      if (height < 0) {
        layerProps.y = scaleDown(mouseClick_y - diameter);
      }

      layerProps.width = scaleSize(diameter);
      layerProps.height = scaleSize(diameter);
      layerProps.radius = scaleSize(Math.abs(diameter) / 2);
    } else {
      layerProps.x = scaleDown(x);
      layerProps.y = scaleDown(y);
    }
  } else if (props.activeTool === "draw") {
    drawLine(
      props.imageDataCache[props.currentLayer.name],
      oX - props.currentLayer.x,
      oY - props.currentLayer.y,
      offsetX - props.currentLayer.x,
      offsetY - props.currentLayer.y,
      isEraser.value
    );
    oX = scaleDown(e.offsetX);
    oY = scaleDown(e.offsetY);
  } else if (props.activeTool === "dot") {
    layerProps.x = offsetX;
    layerProps.y = offsetY;
  } else {
    x = e.offsetX - mouseClick_dx;
    y = e.offsetY - mouseClick_dy;
    // moving text and line layers
    if (["str"].includes(props.currentLayer.type)) {
      layerProps.yy =
        scaleDown(y) - textContainerHeight[props.currentLayer.font];
    }
    if (["line"].includes(props.currentLayer.type)) {
      const { x: x1, y: y1, x2, y2 } = props.currentLayer;
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
  emit("updateCurrentLayer", layerProps);
  redrawCanvas(props.screenElements);
}

function canvasMouseLeave(e) {
  e.preventDefault();
  // this.$refs.cursor.style.transform = `translate3d(-1000px, -1000px, 0)`;
  if (["select", "draw"].includes(props.activeTool) && isMoving.value) {
    isDrawing.value = false;
    stopDrawing(e);
  }
  isMoving.value = false;
}

function canvasMouseUp(e) {
  if (isDrawing.value || isMoving.value) {
    emit("updateCode");
    emit("saveLayers");
    isMoving.value = false;
  }
  if (isDrawing.value) {
    stopDrawing(e);
    isDrawing.value = false;
  }
  if (isDrawing.value || isMoving.value) {
    redrawCanvas(props.screenElements);
  }
}

function stopDrawing(e) {
  isEraser.value = false;
  if (props.currentLayer) {
    const layerProps: TLayerProp = {};
    if (["frame", "box"].includes(props.activeTool)) {
      if (props.currentLayer.width < 0) {
        layerProps.width = Math.abs(props.currentLayer.width);
        layerProps.x = props.currentLayer.x - layerProps.width;
      }
      if (props.currentLayer.height < 0) {
        layerProps.height = Math.abs(props.currentLayer.height);
        layerProps.y = props.currentLayer.y - layerProps.height;
      }
      emit("updateCurrentLayer", layerProps);
    }
  }
}

function addImageToCanvas(name, x = 0, y = 0) {
  if (!props.imageDataCache[name]) {
    props.imageDataCache[name] = imgToCanvasData(props.fuiImages[name].element);
  }
  const { isCustom, width, height } = props.fuiImages[name];
  const layer = {
    type: "icon",
    name: name,
    index: props.layerIndex,
    x: x,
    y: y,
    width: width,
    height: height,
    isOverlay: false,
    isCustom: isCustom,
  };
  emit("updateCurrentLayer", layer);
  emit("addScreenLayer", layer);
  emit("setActiveTool", "select");
  emit("updateCode");
  emit("saveLayers");
}

function redrawCanvas(screenElements) {
  ctx.clearRect(0, 0, canvasWidth.value, canvasHeight.value);
  ctx.save();
  for (let screenElement of screenElements) {
    const imgData = ctx.getImageData(
      0,
      0,
      canvasWidth.value,
      canvasHeight.value
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
      font,
      isOverlay,
    } = screenElement;
    switch (type) {
      case "frame":
        ctx.strokeRect(x + 0.5, y + 0.5, width, height);
        break;
      case "box":
        ctx.fillRect(x, y, width, height);
        break;
      case "dot":
        ctx.fillRect(x, y, 1, 1);
        break;
      case "icon":
        const data = props.imageDataCache[name];
        if (isOverlay) {
          putImageDataWithAlpha(ctx, data, x, y, 0.75);
        } else {
          const newImageData = maskAndMixImageData(imgData, data, x, y);
          ctx.putImageData(newImageData, 0, 0);
        }
        break;
      case "line":
        drawLine(imgData, x, y, x2, y2, false);
        ctx.putImageData(imgData, 0, 0);
        break;
      case "circle":
        drawCircle(
          imgData,
          x + radius,
          y + radius,
          radius,
          canvasWidth.value,
          canvasHeight.value
        );
        ctx.putImageData(imgData, 0, 0);
        break;
      case "disc":
        drawDisc(
          imgData,
          x + radius,
          y + radius,
          radius,
          canvasWidth.value,
          canvasHeight.value
        );
        ctx.putImageData(imgData, 0, 0);
        break;
      case "str":
        const imageDataWithText = drawTextWithMasking(
          imgData,
          x,
          y,
          font,
          text
        );
        ctx.putImageData(imageDataWithText, 0, 0);
        break;
      case "draw":
        const newImageData = maskAndMixImageData(
          imgData,
          props.imageDataCache[screenElement.name],
          x,
          y
        );
        ctx.putImageData(newImageData, 0, 0);
        break;
      default:
        break;
    }
  }
  ctx.restore();
}

function keyDownHandler(event) {
  if (event.isComposing || !Object.values(KEYS).includes(event.keyCode)) {
    return;
  }
  if (event.keyCode === KEYS.ESC) {
    emit("updateCurrentLayer");
    return;
  }
  if (event.target !== document.body) {
    return;
  }
  if (props.currentLayer) {
    event.preventDefault();
    const shift = event.shiftKey ? 10 : 1;
    switch (event.keyCode) {
      case KEYS.UP:
        props.currentLayer.y -= shift;
        break;
      case KEYS.DOWN:
        props.currentLayer.y += shift;
        break;
      case KEYS.LEFT:
        props.currentLayer.x -= shift;
        break;
      case KEYS.RIGHT:
        props.currentLayer.x += shift;
        break;
      default:
        break;
    }
    emit("updateCurrentLayer", props.currentLayer);
    redrawCanvas(props.screenElements);
    emit("saveLayers");
  }
}
</script>
<template>
  <div class="canvas-wrapper">
    <div class="fui-grid">
      <canvas
        id="screen"
        :width="canvasWidth"
        :height="canvasHeight"
        :style="style"
        ref="screen"
        :class="canvasClassNames"
        @mousedown="canvasMouseDown"
        @mousemove="canvasMouseMove"
        @mouseleave="canvasMouseLeave"
        @dragover="
          (e) => {
            e.preventDefault();
          }
        "
        @drop="canvasOnDrop"
      />
      <!-- <div class="fui-cursor fui-cursor_pixel" ref="cursor"></div> -->
    </div>
  </div>
</template>
<style lang="css"></style>
