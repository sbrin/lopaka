<script lang="ts" setup>
import { generateCode, toCppVariableName } from "../utils";
import { computed, onMounted, ref } from "vue";
import FuiButton from "./fui/FuiButton.vue";
import FuiCanvas from "./fui/FuiCanvas.vue";
import FuiDisplays from "./fui/FuiDisplays.vue";
import FuiLayers from "./fui/FuiLayers.vue";
import FuiLibrary from "./fui/FuiLibrary.vue";
import FuiTools from "./fui/FuiTools.vue";
import FuiTabs from "./fui/FuiTabs.vue";
import FuiIcons from "./fui/FuiIcons.vue";
import FuiCode from "./fui/FuiCode.vue";
import FuiFile from "./fui/FuiFile.vue";
import FuiInspector from "./fui/FuiInspector.vue";
let fuiImages = {},
  isInverted = false,
  imageDataCache = {};

const fuiCanvas = ref(null),
  currentLayer = ref(null),
  activeTool = ref("draw"),
  activeTab = ref("code"),
  library = ref("u8g2"),
  display = ref("128×64"),
  codePreview = ref(""),
  customImages = ref([]),
  screenElements = ref([]),
  layerIndex = ref(0);

// computed
const isEmpty = computed(() => screenElements.value.length === 0);
const isFlipper = computed(() => library.value === "flipper");
// methods
function setactiveTab(tab) {
  activeTab.value = tab;
}
function prepareImages(e) {
  fuiImages = e;
}
function updateFuiImages(layer) {
  const { name, element, width, height } = layer;
  const nameFormatted = toCppVariableName(name);
  if (!fuiImages[name]) {
    fuiImages[name] = {
      width: width,
      height: height,
      element: element,
      isCustom: true,
    };
    customImages.value = [
      ...customImages.value,
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
  setactiveTab("icons");
}
function setActiveTool(tool) {
  activeTool.value = tool;
}
function addScreenLayer(layer) {
  screenElements.value = [
    ...screenElements.value,
    layer ? layer : currentLayer.value,
  ];
  layerIndex.value += 1;
  redrawCanvas();
}
function updateCurrentLayer(layerProps) {
  if (layerProps) {
    const layer = {
      ...currentLayer.value,
      ...layerProps,
    };
    screenElements.value = screenElements.value.map((item) => {
      if (item.index === layer.index) {
        return layer;
      }
      return item;
    });
    currentLayer.value = layer;
  } else {
    currentLayer.value = null;
  }
}
function removeLayer(index) {
  if (currentLayer.value && currentLayer.value.index === index) {
    currentLayer.value = null;
  }
  screenElements.value = screenElements.value.filter(
    (item) => item.index !== index
  );
  updateCode();
  redrawCanvas();
  saveLayers();
}
function resetScreen() {
  screenElements.value = [];
  codePreview.value = "";
  currentLayer.value = null;
  redrawCanvas();
  saveLayers();
}
function redrawCanvas() {
  fuiCanvas.value.redrawCanvas(screenElements.value);
}
function copyCode() {
  navigator.clipboard.writeText(codePreview.value);
}
function cleanCustomIcons() {
  for (let key in fuiImages) {
    if (fuiImages[key].isCustom) {
      delete fuiImages[key];
      delete imageDataCache[key];
    }
  }
  customImages.value = [];
  screenElements.value = screenElements.value.filter((item) => !item.isCustom);
  redrawCanvas();
  saveLayers();
  if (currentLayer.value && currentLayer.value.isCustom) {
    currentLayer.value = null;
  }
}
function selectLibrary(l) {
  library.value = l;
  if (library.value === "flipper") {
    if (activeTool.value === "draw") {
      activeTool.value = "frame";
    }
    display.value = "128×64";
  }
  updateCode();
}
function updateCode() {
  const context = fuiCanvas.value.screen.getContext("2d", {
    willReadFrequently: true,
  });
  codePreview.value = generateCode(
    screenElements.value,
    library.value,
    context,
    imageDataCache
  );
}
function postMessage(type, data) {
  if (window.top !== window.self) {
    window.top.postMessage(
      { target: "lopaka_app", type: type, payload: data },
      "*"
    );
  }
}
function saveLayers() {
  postMessage("updateLayers", JSON.stringify(screenElements.value));
}
function addImageToCanvas(name) {
  fuiCanvas.value.addImageToCanvas(name);
}
function selectDisplay(d) {
  display.value = d;
}

onMounted(() => {
  if (isFlipper) {
    activeTool.value = "frame";
  }
  if (screenElements.value.length) {
    updateCode();
    layerIndex.value = screenElements.value.length;
  }
  postMessage("mounted", {});
});

if (localStorage.getItem("lopaka_library")) {
  library.value = localStorage.getItem("lopaka_library");
}
if (localStorage.getItem("lopaka_display")) {
  display.value = localStorage.getItem("lopaka_display");
}
// screenElements = JSON.parse(localStorage.getItem("lopaka_layers")) ?? [];
window.addEventListener("message", (event) => {
  if (event.data && event.data.target === "lopaka_app") {
    switch (event.data.type) {
      case "updateLayers":
        screenElements.value = event.data.layers;
        break;
      case "loadProject":
        screenElements.value = event.data.payload.layers;
        library.value = event.data.payload.library;
        display.value = event.data.payload.display;
        break;
    }
    layerIndex.value = screenElements.value.length;
    redrawCanvas();
  }
});
</script>
<template>
  <div class="fui-editor">
    <div class="fui-editor__left">
      <FuiLayers
        v-show="!!screenElements.length"
        :screen-elements="screenElements"
        :current-layer="currentLayer"
        @update-current-layer="updateCurrentLayer"
        @remove-layer="removeLayer"
      ></FuiLayers>
      <FuiButton
        @click="resetScreen"
        title="reset"
        class="button_danger"
        v-show="!isEmpty"
      ></FuiButton>
    </div>
    <div class="fui-editor__center">
      <div class="fui-editor-header">
        <FuiLibrary
          @select-library="selectLibrary"
          :library="library"
        ></FuiLibrary>
        <FuiDisplays
          v-show="!isFlipper"
          @update-display="selectDisplay"
          :display="display"
        ></FuiDisplays>
      </div>
      <FuiCanvas
        ref="fuiCanvas"
        :key="display"
        :display="display"
        :layer-index="layerIndex"
        :screen-elements="screenElements"
        :current-layer="currentLayer"
        :active-tool="activeTool"
        :fui-images="fuiImages"
        :imageDataCache="imageDataCache"
        :library="library"
        @update-current-layer="updateCurrentLayer"
        @set-active-tool="setActiveTool"
        @update-fui-images="updateFuiImages"
        @update-code="updateCode"
        @add-screen-layer="addScreenLayer"
        @save-layers="saveLayers"
      />
      <div class="fui-editor__tools">
        <FuiTools
          :callback="setActiveTool"
          :active-tool="activeTool"
          :library="library"
        ></FuiTools>
        <div class="fui-editor-header">
          <FuiTabs
            :active-tab="activeTab"
            @set-active-tab="setactiveTab"
          ></FuiTabs>
        </div>
        <FuiIcons
          v-show="activeTab === 'icons'"
          :fui-images="fuiImages"
          :custom-images="customImages"
          @prepare-images="prepareImages"
          @icon-clicked="addImageToCanvas"
          @clean-custom-icons="cleanCustomIcons"
          ref="fuiIconsList"
        ></FuiIcons>
        <FuiCode v-show="activeTab === 'code'" :content="codePreview"></FuiCode>
        <div class="buttons-bottom">
          <FuiFile
            type="file"
            title="import image"
            @update-fui-images="updateFuiImages"
          ></FuiFile>
          <FuiButton
            @click="copyCode"
            title="copy code"
            v-show="!!codePreview"
          ></FuiButton>
        </div>
      </div>
    </div>
    <div class="fui-editor__right">
      <FuiInspector
        :elem="currentLayer"
        :library="library"
        @redraw-canvas="redrawCanvas"
        @update-code="updateCode"
        @save-layers="saveLayers"
        @update-current-layer="updateCurrentLayer"
      />
      <!-- <fui-settings :isInverted="isInverted" @redraw-canvas="redrawCanvas" @toggle-invert="toggleInvert"/> -->
    </div>
  </div>
</template>
<style lang="css"></style>
