const fuiRootTmpl = `
    <div class="fui-editor">
      <div class="fui-editor__left">
        <fui-layers
            :screen-elements="screenElements"
            :current-layer="currentLayer"
            @update-current-layer="updateCurrentLayer"
            @remove-layer="removeLayer"
        ></fui-layers>
        <fui-button @click="resetScreen" title="reset" class="button_danger" v-show="!isEmpty"></fui-button>
      </div>
      <div class="">
        <fui-display @update-display="updateDisplay" :display="display"></fui-display>
        <fui-canvas
          ref="fuiCanvas"
          :key="display"
          :display="display"
          :layer-index="layerIndex"
          :screen-elements="screenElements"
          :current-layer="currentLayer"
          :active-tool="activeTool"
          :fui-images="fuiImages"
          :is-inverted="isInverted"
          @update-current-layer="updateCurrentLayer"
          @set-active-tool="setActiveTool"
          @update-fui-images="updateFuiImages"
          @update-code="updateCode"
          @add-screen-layer="addScreenLayer"
        />
        <div class="fui-editor__center">
          <fui-tools :callback="setActiveTool" :active-tool="activeTool"></fui-tools>
          <div class="fui-editor-header">
            <fui-tabs :active-tab="activeTab" @set-active-tab="setactiveTab"></fui-tabs>
            <fui-library @select-library="selectLibrary" :library="library"></fui-library>
          </div>
          <fui-icons
            v-show="activeTab === 'icons'"
            :fui-images="fuiImages"
            :custom-images="customImages"
            @prepare-images="prepareImages"
            @icon-clicked="addImageToCanvas"
            @clean-custom-icons="cleanCustomIcons"
            ref="fuiIconsList"
          ></fui-icons>
          <fui-code v-show="activeTab === 'code'" :content="codePreview"></fui-code>
          <div class="buttons-bottom">
            <fui-file
              type="file"
              title="import image"
              @update-fui-images="updateFuiImages"
            ></fui-file>
            <fui-button @click="copyCode" title="copy code" v-show="!!codePreview"></fui-button>
          </div>
        </div>
      </div>
      <div class="fui-editor__right">
        <fui-inspector :elem="currentLayer" :library="library" @redraw-canvas="redrawCanvas" />
        <!-- <fui-settings :isInverted="isInverted" @redraw-canvas="redrawCanvas" @toggle-invert="toggleInvert"/> -->
      </div>
    </div>
`;

const fuiLayersTmpl = `
<div class="layers">
    <h2 class="title">Layers</h2>
    <ul class="layers__list">
        <li v-for="(item, idx) in screenElements"
          :key="idx"
          class="layer"
          :class="{layer_selected: currentLayer && currentLayer.index === item.index}"
          @click.self="updateCurrentLayer(item)"
        >
            <div class="layer__name">{{ getLayerListItem(item) }}</div>
            <div class="layer__remove" @click="removeLayer(item.index)">×</div>
        </li>
    </ul>
</div>
`

const fuiToolsTmpl = `
    <div class="tools">
      <fui-button v-for="(item, idx) in toolsList" :key="idx" class="tools__btn" @click="callback(item)" :title="item"
        :active="activeTool === item"></fui-button>
      <fui-button class="tools__btn" @click="callback('str')" title="string" :active="activeTool === 'str'">
      </fui-button>
      <fui-button class="tools__btn" @click="callback('select')" title="select" :active="activeTool === 'select'">
      </fui-button>
    </div>
        `;

const fuiIconsTmpl = `
    <div class="fui-icons">
      <div v-if="customImages.length > 0" class="fui-icons__header">
        <div>Custom</div>
        <div class="fui-icons__remove-custom" @click="cleanCustom" title="Remove all custom icons">×</div>
      </div>
      <img v-for="(item, index) in customImages"
        @dragstart="iconDragStart"
        @click="iconClick"
        draggable="true"
        :key="index"
        :src="item.src"
        :data-name="item.name"
        :width="item.width * 2"
        :height="item.height * 2"
        :alt="item.name"
        :title="item.name"
      />
      <div v-if="customImages.length > 0" class="fui-icons__header">Default</div>
      <img v-for="(item, index) in imagesSrc" @dragstart="iconDragStart" @click="iconClick" draggable="true"
        :key="index" :src="item.src" :data-name="item.name" :width="item.width * 2" :height="item.height * 2"
        :alt="item.name" :title="item.name" />
    </div>
        `
const fuiFileTmpl = `
  <label
    class="button"
    :class="{ button_active: active }"
  >
    <input type="file" style="position: fixed; top: -100%"
      @change="onFileChange"
    >
    {{ title }}
  </label>
`;

const fuiButtonTmpl = `
  <button
    class="button"
    :class="{ button_active: active }"
  >
    {{ title }}
  </button>
`;

const fuiInspectorTmpl = `
<div class="inspector" v-if="elem">
  <div class="title inspector__title">{{elem.name || elem.type}}</div>
  <div class="inspector__row">
    <div>x: <fui-inspector-input :element="elem" field="x" type="number" @redraw-canvas="redrawCanvas">
      </fui-inspector-input>
    </div>
    <div v-if="typeof elem.x2 === 'number'">x2: <fui-inspector-input :element="elem" field="x2" type="number"
        @redraw-canvas="redrawCanvas"></fui-inspector-input>
    </div>
    <div v-if="typeof elem.width === 'number' && isHWVisible(elem)">w: <fui-inspector-input :element="elem"
        field="width" type="number" @redraw-canvas="redrawCanvas"></fui-inspector-input>
    </div>
    <div v-if="typeof elem.radius === 'number' && isRadiusVisible(elem)">r: <fui-inspector-input :element="elem"
        field="radius" type="number" @redraw-canvas="redrawCanvas"></fui-inspector-input>
    </div>
  </div>
  <div class="inspector__row">
    <div>y: <fui-inspector-input :element="elem" field="y" type="number" @redraw-canvas="redrawCanvas">
      </fui-inspector-input>
    </div>
    <div v-if="typeof elem.y2 === 'number'">y2: <fui-inspector-input :element="elem" field="y2" type="number"
        @redraw-canvas="redrawCanvas"></fui-inspector-input>
    </div>
    <div v-if="typeof elem.height === 'number' && isHWVisible(elem)">h: <fui-inspector-input :element="elem"
        field="height" type="number" @redraw-canvas="redrawCanvas"></fui-inspector-input>
    </div>
  </div>
  <div class="inspector__row">
    <div v-if="elem.font">
      <fui-inspector-input :element="elem" field="font" :library="library" type="select" @redraw-canvas="redrawCanvas">
      </fui-inspector-input>
    </div>
  </div>
  <div class="inspector__row">
    <div v-if="elem.type === 'str'">
      <fui-inspector-input :element="elem" field="text" :library="library" type="text" @redraw-canvas="redrawCanvas">
      </fui-inspector-input>
    </div>
  </div>
</div>
`;
const fuiSettingsTmpl = `
<div class="fui-settings">
  <div class="fui-settings__input">
    <button class="button" :class="settingsClassNames" @click="toggleInvert">Invert color</label>
  </div>
</div>`;