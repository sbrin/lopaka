const fuiEditorTmpl = `
    <div class="fui-editor">
      <div class="fui-editor__left">
        <fui-layers
            :screen-elements="screenElements"
            :screen-current-element="screenCurrentElement"
            @set-current-item="setCurrentItem"
            @remove-layer="removeLayer"
        ></fui-layers>
      </div>
      <div class="fui-editor__center">
        <div class="canvas-wrapper">
          <canvas id="screen" width="128" height="64" ref="screen" :class="canvasClassNames"
            @mousedown="canvasMouseDown" @mouseleave="canvasMouseLeave" @mousemove="canvasMouseMove"
            @mouseleave="canvasMouseLeave" @dragover="(e) => { e.preventDefault() }" @drop="canvasOnDrop" />
        </div>
        <fui-tools :callback="setActiveTool" :active-tool="activeTool"></fui-tools>
        <fui-tabs :active-tab="mainTab" @set-active-tab="setMainTab"></fui-tabs>
        <fui-icons v-show="mainTab === 'icons'" :custom-images="customImages" @prepare-images="prepareImages"
          @icon-clicked="addImageToCanvas" @clean-custom-icons="cleanCustomIcons" ref="fuiIconsList"></fui-icons>
        <fui-code v-show="mainTab === 'code'" :content="codePreview"></fui-code>
        <div class="buttons-bottom">
          <fui-button @click="resetScreen" title="reset" class="button_danger" v-show="!isEmpty"></fui-button>
          <fui-button @click="copyCode" title="copy code" v-show="!!codePreview"></fui-button>
        </div>
      </div>
      <div class="fui-editor__right">
        <fui-inspector :elem="screenCurrentElement" @redraw-canvas="redrawCanvas" />
        <fui-settings :isInverted="isInverted" @redraw-canvas="redrawCanvas" @toggle-invert="toggleInvert"/>
      </div>
    </div>
`;

const fuiLayersTmpl = `
<div class="layers">
    <h2 class="title">Layers</h2>
    <ul class="layers__list">
        <li v-for="(item, idx) in screenElements" :key="idx" class="layer"
            :class="{layer_selected: screenCurrentElement && screenCurrentElement.index === item.index}"
            @click="setCurrentItem(item)">
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
      <img v-for="(item, index) in customImages" @dragstart="iconDragStart" @click="iconClick" draggable="true"
        :key="index" :src="item.src" :data-name="item.name" :width="item.width * 2" :height="item.height * 2"
        :alt="item.name" :title="item.name" />
      <div v-if="customImages.length > 0" class="fui-icons__header">Default</div>
      <img v-for="(item, index) in imagesSrc" @dragstart="iconDragStart" @click="iconClick" draggable="true"
        :key="index" :src="item.src" :data-name="item.name" :width="item.width * 2" :height="item.height * 2"
        :alt="item.name" :title="item.name" />
    </div>
        `
const fuiButtonTmpl = `
            <button class="button" :class="{ button_active: active }">
                {{ title }}
            </button>
        `
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
      <fui-inspector-input :element="elem" field="font" type="select" @redraw-canvas="redrawCanvas">
      </fui-inspector-input>
    </div>
  </div>
  <div class="inspector__row">
    <div v-if="elem.type === 'str'">
      <fui-inspector-input :element="elem" field="text" type="text" @redraw-canvas="redrawCanvas">
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