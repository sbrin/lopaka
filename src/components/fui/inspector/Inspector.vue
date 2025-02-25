<script lang="ts" setup>
import {ComputedRef, UnwrapRef, computed, toRefs} from 'vue';
import {AbstractImageLayer} from '/src/core/layers/abstract-image.layer';
import {AbstractLayer, TLayerModifier, TLayerModifiers, TModifierType} from '/src/core/layers/abstract.layer';
import {useSession} from '/src/core/session';
import {loadFont} from '/src/draw/fonts';
import Button from '/src/components/layout/Button.vue';
import {logEvent} from '/src/utils';
import Icon from '/src/components/layout/Icon.vue';
import {PaintLayer} from '/src/core/layers/paint.layer';
import TextEditable from '/src/components/layout/TextEditable.vue';
import SelectFont from '/src/components/fui/inspector/SelectFont.vue';
import {Project, ProjectScreen} from '/src/types';
import {TextLayer} from '/src/core/layers/text.layer';
import ShortcutsPanel from '/src/components/fui/inspector/ShortcutsPanel.vue';
import ImageOperations from '/src/components/fui/inspector/ImageOperations.vue';
import AlignButtons from './AlignButtons.vue';
import {alignLayer, alignMultipleLayers} from './alignLayers';

const props = defineProps<{
    readonly?: boolean;
    project: Project;
    screen: ProjectScreen;
}>();

const session = useSession();
const {platform} = toRefs(session.state);
const {updates} = toRefs(session.virtualScreen.state);
const {selectionUpdates} = toRefs(session.editor.state);
let lastUpdate = 0;

const activeLayer: ComputedRef<UnwrapRef<AbstractLayer>> = computed(() => {
    const selection = session.state.layers.filter((l) => l.selected);
    return updates.value && selection.length == 1 ? selection[0] : null;
});

const params: ComputedRef<UnwrapRef<TLayerModifiers>> = computed(() =>
    updates.value && activeLayer.value ? activeLayer.value.modifiers : {}
);

const actions = computed(() => (updates.value && activeLayer.value ? activeLayer.value.actions : []));

const selectedLayersNumber = computed(
    () => session.state.layers.filter((l) => l.selected && l instanceof AbstractLayer).length
);

const layerToMerge = computed(() => selectionUpdates.value && selectedLayersNumber.value > 1);

const fonts = computed(() => {
    return session.platforms[platform.value].getFonts();
});

const palette = computed(() => {
    return session.platforms[platform.value].features.palette;
});

const fontsUsed = computed(() => {
    const allLayers = props.project.screens
        .filter((screen) => screen.id !== props.screen.id)
        .flatMap((screen) => screen.layers);
    const projectFonts = allLayers.filter((layer) => layer?.t === 'string').map((layer) => layer?.f);
    const sessionFonts = session.state.layers
        .filter((layer) => layer instanceof TextLayer)
        .map((layer) => layer.font.name);
    return [...projectFonts, ...sessionFonts];
});

const isDeleteButtonVisible = computed(() => {
    if (!props.readonly && (activeLayer.value || selectedLayersNumber.value)) {
        if (activeLayer.value?.getType() === 'paint' && !(activeLayer.value as PaintLayer).data) {
            return false;
        }
        return true;
    }
    return false;
});

function updateLayerName(text) {
    activeLayer.value.setName(text);
    session.virtualScreen.redraw();
}

function onChange(event: Event, param: TLayerModifier, value?: any) {
    if (Date.now() - lastUpdate > 500) {
        activeLayer.value.pushHistory();
    }
    lastUpdate = Date.now();
    const target = event.target as HTMLInputElement;
    switch (param.type) {
        case TModifierType.number:
            param.setValue(parseFloat(target.value));
            break;
        case TModifierType.string:
        case TModifierType.color:
            if (props.readonly) return;
            if (value) {
                param.setValue(value);
            } else {
                param.setValue(target.value);
            }
            break;
        case TModifierType.boolean:
            param.setValue(target.checked);
            break;
        case TModifierType.font:
            const allFonts = [...session.platforms[platform.value].getFonts(), ...session.state.customFonts];
            const font = allFonts.find((f: TPlatformFont) => f.name === target.value) || allFonts[0];
            // lock screen while loading font
            session.lock();
            loadFont(font).then(() => {
                session.unlock();
                param.setValue(font.name);

                session.virtualScreen.redraw();
            });

            rememberLastFont(font.name);
            break;
    }
    if (Date.now() - lastUpdate > 500) {
        activeLayer.value.pushRedoHistory();
    }
    session.virtualScreen.redraw();
}

function mergeLayers() {
    session.mergeLayers(
        (session.state.layers as AbstractLayer[]).filter(
            (l) => l.selected && (!(l instanceof AbstractImageLayer) || !l.overlay)
        )
    );
    logEvent('button_merge');
}

function rememberLastFont(fontName) {
    session.editor.lastFontName = fontName;
}

function deleteLayers() {
    const selected = session.state.layers.filter((layer) => layer.selected);
    if (selected.length) {
        selected.forEach((l) => session.removeLayer(l as AbstractLayer));
    }
}

const LABELS = {
    font: 'Font',
    fontSize: 'Size',
    text: '',
    inverted: 'XOR Draw',
    fill: 'Filled',
    color: 'Color',
    overlay: 'Overlay',
    radius: 'R',
    radiusX: 'RX',
    radiusY: 'RY',
    x: 'X',
    y: 'Y',
    x1: 'X1',
    y1: 'Y1',
    x2: 'X2',
    y2: 'Y2',
    w: 'W',
    h: 'H',
};
</script>
<template>
    <ShortcutsPanel
        v-if="!readonly && !layerToMerge && !activeLayer"
        class="pt-1"
    />
    <div
        class="text-lg pb-2 pt-1"
        v-if="layerToMerge"
    >
        <div>Selected layers ({{ selectedLayersNumber }})</div>
        <AlignButtons
            v-if="!readonly"
            @align="alignMultipleLayers($event, session)"
        />
    </div>
    <div
        v-if="
            (activeLayer && activeLayer?.getType() !== 'paint') ||
            (activeLayer?.getType() === 'paint' && (activeLayer as PaintLayer).data)
        "
        class="pt-1"
    >
        <div class="text-lg pb-2 flex flex-row items-center grid grid-cols-[24px_minmax(0,1fr)]">
            <Icon
                :type="activeLayer.getType()"
                sm
                class="text-gray-500 mr-2"
            ></Icon>
            <TextEditable
                :text="activeLayer.name"
                @update="updateLayerName"
                class="text-lg"
                :readonly="readonly"
            />
        </div>
        <AlignButtons
            v-if="!readonly"
            @align="alignLayer($event, activeLayer as AbstractLayer, session)"
            :layer="activeLayer"
        />
        <div class="flex flex-row flex-wrap justify-between gap-2 mb-4">
            <template v-for="(param, name) in params">
                <div
                    class="flex pb-1"
                    v-if="param.type !== TModifierType.image"
                    :class="{
                        'flex-col items-start w-full': ![TModifierType.boolean, TModifierType.number].includes(
                            param.type
                        ),
                        'flex-row items-center w-24': [TModifierType.number].includes(param.type),
                        'flex-row items-center w-full': [TModifierType.boolean].includes(param.type),
                        'w-full': [TModifierType.string].includes(param.type),
                    }"
                >
                    <label
                        class="flex gap-2 text-sm"
                        :class="{
                            'input items-center input-bordered input-sm w-24 text-gray-400':
                                param.type == TModifierType.number,
                            'input items-center input-bordered input-sm w-full': param.type == TModifierType.string,
                            'w-full items-center': [TModifierType.boolean, TModifierType.font].includes(param.type),
                            'w-full flex-col': [TModifierType.color].includes(param.type),
                        }"
                    >
                        <div v-if="![TModifierType.boolean, TModifierType.string].includes(param.type)">
                            {{ LABELS[name] ?? name }}
                        </div>
                        <div
                            v-if="param.type == TModifierType.number"
                            class=""
                        >
                            <input
                                :disabled="readonly"
                                class="text-primary w-14"
                                :class="{'text-white': readonly || !param.setValue}"
                                type="number"
                                :value="param.getValue()"
                                @change="onChange($event, param)"
                                :readonly="!param.setValue"
                                :id="`inspector_${param.type}_${name}`"
                            />
                        </div>
                        <input
                            v-else-if="param.type == TModifierType.boolean"
                            :disabled="readonly"
                            class="checkbox checkbox-sm checkbox-primary no-animation"
                            type="checkbox"
                            :checked="param.getValue()"
                            @change="onChange($event, param)"
                            :readonly="!param.setValue"
                            :id="`inspector_${param.type}_${name}`"
                            :key="updates + '_' + name"
                        />
                        <template v-else-if="param.type == TModifierType.string">
                            <input
                                :disabled="readonly"
                                placeholder="Enter text..."
                                class="text-primary"
                                :class="{'text-white': readonly}"
                                type="text"
                                :value="param.getValue()"
                                @keyup="onChange($event, param)"
                                :readonly="!param.setValue"
                            />
                        </template>
                        <div v-else-if="param.type == TModifierType.color">
                            <div
                                class="color-palette"
                                v-if="palette.length"
                                :key="updates + '_' + name"
                            >
                                <div
                                    class="color-palette-box"
                                    @click="onChange($event, param, color)"
                                    v-for="color in palette"
                                    :style="{backgroundColor: color}"
                                    :class="{selected: color === param.getValue()}"
                                ></div>
                            </div>
                            <input
                                v-else
                                :disabled="readonly"
                                class="text-primary select select-bordered select-sm w-16 pl-0 pr-1"
                                type="color"
                                :value="param.getValue()"
                                @input="onChange($event, param)"
                                :readonly="!param.setValue"
                                list="presetColors"
                                :id="`inspector_${param.type}_${name}`"
                            />
                        </div>
                        <div
                            v-else-if="param.type == TModifierType.font"
                            class=""
                        >
                            <SelectFont
                                :fonts="fonts"
                                :fontsUsed="fontsUsed"
                                :project_id="project.id"
                                :disabled="readonly"
                                :fontValue="param.getValue()"
                                @change="(event) => onChange(event, param)"
                            />
                        </div>
                        <template v-if="param.type === TModifierType.boolean">
                            {{ LABELS[name] ?? name }}
                        </template>
                    </label>
                </div>
            </template>
        </div>
        <ImageOperations
            v-if="!readonly"
            :actions="actions"
            :activeLayer="activeLayer"
        />

        <datalist id="presetColors">
            <!-- 16 colors -->
            <option>#000000</option>
            <option>#0000AA</option>
            <option>#00AA00</option>
            <option>#00AAAA</option>
            <option>#AA0000</option>
            <option>#AA00AA</option>
            <option>#AA5500</option>
            <option>#AAAAAA</option>
            <option>#555555</option>
            <option>#5555FF</option>
            <option>#55FF55</option>
            <option>#55FFFF</option>
            <option>#FF5555</option>
            <option>#FF55FF</option>
            <option>#FFFF55</option>
            <option>#FFFFFF</option>
        </datalist>
    </div>
    <div
        v-if="(activeLayer && !['icon', 'paint'].includes(activeLayer.getType())) || layerToMerge"
        class="flex flex-row gap-2"
    >
        <Button
            v-if="!readonly"
            @click="mergeLayers"
            title="Merge layers into bitmap to Paint on it"
        >
            Merge to Bitmap
        </Button>
    </div>
    <div
        class="mt-2"
        v-if="isDeleteButtonVisible"
    >
        <Button
            danger
            @click="deleteLayers"
        >
            Delete
        </Button>
    </div>
</template>
<style lang="css" scoped>
.inspector-panel {
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    column-gap: 8px;
}

.inspector-actions {
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    column-gap: 8px;
    row-gap: 8px;
}

.inspector-panel__param {
    flex: 0 0 calc(50% - 4px);
    display: flex;
    align-items: flex-start;
    margin-bottom: 8px;
    font-size: var(--input-font-size);
}

.inspector-panel__param_row {
    flex-direction: row;
    margin-top: 8px;
    align-items: center;
}

.inspector-panel__param_wide {
    flex-basis: fit-content;
    flex-grow: 1;
}

.inspector__title {
    overflow: hidden;
}

.inspector__input {
    border: none;
    outline: none;
    width: 100%;
}

.inspector__input[type='color'] {
    /* height: 20px; */
    padding: 0px;
    width: 60px;
}

select.inspector__input {
    width: 165px;
}

.color-palette {
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    column-gap: 5px;
    row-gap: 5px;
    background-color: var(--secondary-color);
    padding: 5px;
    width: fit-content;
    border-radius: 6px;
}

.color-palette-box {
    width: 20px;
    height: 20px;
    cursor: pointer;
    border: 2px solid var(--secondary-color);
    border-radius: 4px;
}

.color-palette-box.selected {
    border-color: var(--primary-color);
}
</style>
