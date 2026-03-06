<script
    lang="ts"
    setup
>
import { ComputedRef, UnwrapRef, computed, toRefs, ref, watch, nextTick } from 'vue';
import { AbstractImageLayer } from '/src/core/layers/abstract-image.layer';
import { AbstractLayer, TLayerModifier, TLayerModifiers, TModifierType } from '/src/core/layers/abstract.layer';
import { useSession } from '/src/core/session';
import { loadFont } from '/src/draw/fonts';
import Button from '/src/components/layout/Button.vue';
import Icon from '/src/components/layout/Icon.vue';
import { PaintLayer } from '/src/core/layers/paint.layer';
import TextEditable from '/src/components/layout/TextEditable.vue';
import SelectFont from '/src/components/fui/inspector/SelectFont.vue';
import { TextLayer } from '/src/core/layers/text.layer';
import { TextAreaLayer } from '/src/core/layers/text-area.layer';
import ShortcutsPanel from '/src/components/fui/inspector/ShortcutsPanel.vue';
import ImageOperations from '/src/components/fui/inspector/ImageOperations.vue';
import AlignButtons from './AlignButtons.vue';
import SwitchInputVariable from '/src/components/fui/inspector/SwitchInputVariable.vue';
import { alignLayer, alignMultipleLayers } from './alignLayers';
import { ProjectScreen } from '/src/types';
import { ButtonLayer } from '/src/core/layers/button.layer';
import { CheckboxLayer } from '/src/core/layers/checkbox.layer';
import { shouldShowInspectorParam } from './inspector-params';

const props = defineProps<{
    readonly?: boolean;
    project: Project;
    screen: ProjectScreen;
}>();

const session = useSession();
const { platform, immidiateUpdates, selectionUpdates } = toRefs(session.state);
const { textEditMode, activeTool } = toRefs(session.editor.state);
let lastUpdate = 0;

// Ref for text inputs or textareas in the inspector.
const textInputRef = ref<(HTMLInputElement | HTMLTextAreaElement)[] | null>(null);

const activeLayer: ComputedRef<UnwrapRef<AbstractLayer>> = computed(() => {
    const { selected } = session.layersManager;
    return immidiateUpdates.value && selectionUpdates.value && selected.length == 1 ? selected[0] : null;
});

// Keep inspector fields visible for new paint layers while the paint tool is active.
const shouldShowLayerDetails = computed(() => {
    const layer = activeLayer.value;
    // Hide inspector details when no single layer is selected.
    if (!layer) {
        return false;
    }
    // Always show details for non-paint layers.
    if (layer.getType() !== 'paint') {
        return true;
    }
    // Show paint layer details once it has image data.
    if ((layer as PaintLayer).data) {
        return true;
    }
    // Keep details visible for an empty paint layer while painting is active.
    return activeTool.value?.getName() === 'paint';
});

// Detect when the current selection matches an entire group
const activeGroupName = computed(() => {
    if (!immidiateUpdates.value) {
        return null;
    }
    const selected = session.layersManager.selected;
    if (!selected.length) {
        return null;
    }
    const group = selected[0].group;
    if (!group) {
        return null;
    }
    if (!selected.every((layer) => layer.group === group)) {
        return null;
    }
    const members = session.layersManager.getLayersInGroup(group);
    if (members.length !== selected.length) {
        return null;
    }
    return group;
});

const params: ComputedRef<UnwrapRef<TLayerModifiers>> = computed(() =>
    immidiateUpdates.value && activeLayer.value ? activeLayer.value.modifiers : {}
);

const actions = computed(() => (immidiateUpdates.value && activeLayer.value ? activeLayer.value.actions : []));

const selectedLayersNumber = computed(() => selectionUpdates.value && session.layersManager.selected.length);

const layerToMerge = computed(() => selectedLayersNumber.value > 1);

const fonts = computed(() => {
    return session.platforms[platform.value].getFonts();
});

const palette = computed(() => {
    return session.platforms[platform.value].features.palette;
});

// Detect when the active text modifier belongs to a text area layer.
const isTextAreaTextParam = (name: string, param: TLayerModifier) => {
    return name === 'text' && param.type === TModifierType.string && activeLayer.value instanceof TextAreaLayer;
};

const fontsUsed = computed(() => {
    const allLayers = props.project.screens
        .filter((screen) => screen.id !== props.screen?.id)
        .flatMap((screen) => screen.layers);
    const projectFonts = allLayers.filter((layer) => layer?.t === 'string').map((layer) => layer?.f);
    // Include text area fonts when gathering project-wide font usage.
    const sessionFonts = session.layersManager.layers
        .filter((layer) => layer instanceof TextLayer || layer instanceof TextAreaLayer)
        .map((layer) => (layer as TextLayer | TextAreaLayer).font.name);
    return [...projectFonts, ...sessionFonts];
});

// Use a shared helper to keep modifier visibility logic testable.
const shouldShowParam = (name: string, param: TLayerModifier) => {
    // Delegate the decision to the shared visibility helper.
    return shouldShowInspectorParam({ name, param, platformId: platform.value });
};

// Group consecutive visible color params so the template can wrap them in a single flex container.
const colorGroups = computed(() => {
    const firstOfGroup = new Set<string>();
    const inGroup = new Set<string>();
    const groups = new Map<string, { name: string; param: UnwrapRef<TLayerModifier> }[]>();
    if (!params.value) return { firstOfGroup, inGroup, groups };

    const visible: { name: string; param: UnwrapRef<TLayerModifier> }[] = [];
    for (const [name, param] of Object.entries(params.value)) {
        if (shouldShowParam(name, param as UnwrapRef<TLayerModifier>)) {
            visible.push({ name, param: param as UnwrapRef<TLayerModifier> });
        }
    }

    let i = 0;
    while (i < visible.length) {
        if (visible[i].param.type === TModifierType.color) {
            const start = i;
            while (i + 1 < visible.length && visible[i + 1].param.type === TModifierType.color) {
                i++;
            }
            if (i > start) {
                const group = visible.slice(start, i + 1);
                firstOfGroup.add(group[0].name);
                for (const entry of group) {
                    inGroup.add(entry.name);
                }
                groups.set(group[0].name, group);
            }
        }
        i++;
    }

    return { firstOfGroup, inGroup, groups };
});

const isFirstInColorGroup = (name: string) => colorGroups.value.firstOfGroup.has(name as string);
const isInColorGroup = (name: string) => colorGroups.value.inGroup.has(name as string);
const getColorGroup = (name: string) => colorGroups.value.groups.get(name as string) || [];

const isDeleteButtonVisible = computed(() => {
    if (!props.readonly && (layerToMerge.value || activeLayer.value)) {
        if (activeLayer.value?.getType() === 'paint' && !(activeLayer.value as PaintLayer).data) {
            return false;
        }
        return true;
    }
    return false;
});

function updateLayerName(text) {
    activeLayer.value.setName(text);
    session.layersManager.update(); // Trigger reactivity for layers list
    session.virtualScreen.redraw();
}

// Forward group rename requests to the layers manager
function updateGroupName(text: string) {
    if (!activeGroupName.value) {
        return;
    }
    session.layersManager.renameGroup(activeGroupName.value, text);
    session.layersManager.update(); // Trigger reactivity for layers list
}

function onChange(event: Event, param: TLayerModifier, value?: any) {
    if (Date.now() - lastUpdate > 500) {
        activeLayer.value && activeLayer.value.pushHistory();
    }
    lastUpdate = Date.now();
    // Read the current value from either an input or textarea.
    const target = event.target as HTMLInputElement | HTMLTextAreaElement;
    if (props.readonly) return;
    switch (param.type) {
        case TModifierType.number:
            const parsedValue = parseInt(target.value);
            const newNumberValue = isNaN(parsedValue) ? 0 : parsedValue;
            target.value = newNumberValue.toString();
            param.setValue(newNumberValue);
            break;
        case TModifierType.string:
            param.setValue(target.value);
            break;
        case TModifierType.color:
            const newColorValue = value ?? target.value;
            param.setValue(newColorValue);
            rememberLastColor(newColorValue);
            break;
        case TModifierType.boolean:
            param.setValue(target.checked);
            break;
        case TModifierType.font:
            const allFonts = [...session.platforms[platform.value].getFonts(), ...session.state.customFonts];
            const font = allFonts.find((f: TPlatformFont) => f.name === target.value) || allFonts[0];
            // lock screen while loading font
            session.lock();

            loadFont(font)
                .then(() => {
                    session.unlock();
                    param.setValue(font.name);
                    session.virtualScreen.redraw();
                })
                .catch((e) => {
                    session.state.warnings = [
                        `Unable to load font. ${e}. Please check if it matches GFX or BDF specs.`,
                    ];
                    session.unlock();
                });

            rememberLastFont(font.name);
            break;
    }
    if (Date.now() - lastUpdate > 500) {
        activeLayer.value && activeLayer.value.pushRedoHistory();
    }
    session.virtualScreen.redraw();
}

function onChangeVariable(event: Event, param: TLayerModifier, name: string) {
    const target = event.target as HTMLInputElement;
    param.setVariable(name, target.checked);
    session.virtualScreen.redraw();
}

function mergeLayers() {
    session.layersManager.mergeLayers(
        (session.layersManager.sorted as AbstractLayer[]).filter(
            (l) => l.selected && (!(l instanceof AbstractImageLayer) || !l.overlay)
        )
    );
    logEvent('button_merge');
}

function rememberLastFont(fontName) {
    session.editor.lastFontName = fontName;
}

function rememberLastColor(color) {
    // session.setBrushColor(color);
    session.setLastColor(color);
}

function deleteLayers() {
    const selected = session.layersManager.selected;
    if (selected.length) {
        // Remove every selected layer as one undoable change
        session.layersManager.removeLayers(selected as AbstractLayer[]);
    }
}

const LABELS = {
    font: 'Font',
    fontSize: 'Size',
    text: '',
    inverted: 'Inverted (XOR)',
    fill: 'Filled',
    color: 'Fill',
    overlay: 'Overlay',
    alphaChannel: 'Alpha channel',
    radius: 'R',
    rx: 'RX',
    ry: 'RY',
    x: 'X',
    y: 'Y',
    x1: 'X1',
    y1: 'Y1',
    x2: 'X2',
    y2: 'Y2',
    w: 'W',
    h: 'H',
    backgroundColor: 'Back',
    borderColor: 'Border',
    borderWidth: 'BW',
    checked: 'Checked',
};

// Provide tooltip text for inspector fields that need additional context.
const TOOLTIPS = {
    alphaChannel: 'Use alpha channel for RGB images',
    overlay: 'Dim the layer and skip it from code generation'
};

// Watch for text edit mode trigger
watch(textEditMode, () => {
    // Auto-focus the text field when editing text-based layers.
    if (
        // Auto-focus the text field for text-based layer types.
        (activeLayer.value instanceof TextLayer ||
            activeLayer.value instanceof TextAreaLayer ||
            activeLayer.value instanceof ButtonLayer ||
            activeLayer.value instanceof CheckboxLayer) &&
        textInputRef.value &&
        !props.readonly
    ) {
        nextTick(() => {
            // Focus the first text input or textarea when editing starts.
            const textInput = textInputRef.value?.[0];
            if (textInput && !textInput.disabled) {
                textInput.focus();
                textInput.select();
            }
        });
    }
});
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
        <div
            v-if="activeGroupName"
            class="text-lg pb-2 flex flex-row items-center grid grid-cols-[24px_minmax(0,1fr)]"
        >
            <Icon
                type="rect-group"
                sm
                class="text-gray-500 mr-2"
            ></Icon>
            <TextEditable
                :text="activeGroupName"
                @update="updateGroupName"
                class="text-lg"
                :readonly="readonly"
            />
        </div>
        <div
            class="pb-2"
            v-else
        >
            Selected layers ({{ selectedLayersNumber }})
        </div>
        <AlignButtons
            v-if="!readonly"
            @align="alignMultipleLayers($event, session)"
        />
    </div>
    <div
        v-if="shouldShowLayerDetails"
        class="pt-1"
    >
        <div class="text-lg pb-2 flex flex-row items-center grid grid-cols-[24px_minmax(0,1fr)]">
            <Icon
                :type="activeLayer.getIcon()"
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
            <template
                v-for="(param, name) in params"
                :key="name"
            >
                <!-- Grouped consecutive color params in a flex row -->
                <div
                    v-if="isFirstInColorGroup(name)"
                    class="flex flex-row flex-wrap gap-4 w-full pb-1"
                >
                    <div
                        v-for="entry in getColorGroup(name)"
                        :key="entry.name"
                        class="flex flex-col items-start"
                    >
                        <div class="flex gap-2 items-center">
                            <label class="input input-sm p-0">
                                {{ LABELS[entry.name] ?? entry.name }}
                            </label>
                            <SwitchInputVariable
                                v-if="!entry.param.fixed"
                                :disabled="readonly"
                                :value="entry.param.getVariable(entry.name)"
                                @change="onChangeVariable($event, entry.param, entry.name)"
                            />
                        </div>
                        <label class="flex gap-2 text-sm w-full flex-col">
                            <div>
                                <div
                                    class="color-palette"
                                    v-if="palette && palette.length"
                                    :key="immidiateUpdates + '_' + entry.name"
                                >
                                    <div
                                        v-for="color in palette"
                                        class="color-palette-box"
                                        @click="onChange($event, entry.param, color)"
                                        :style="{ backgroundColor: color }"
                                        :class="{ selected: color === entry.param.getValue() }"
                                    ></div>
                                </div>
                                <input
                                    v-else
                                    :disabled="readonly"
                                    class="text-primary select select-bordered select-sm w-12 pl-0 pr-1"
                                    type="color"
                                    :value="entry.param.getValue()"
                                    @input="onChange($event, entry.param)"
                                    :readonly="!entry.param.setValue"
                                    list="presetColors"
                                    :id="`inspector_${entry.param.type}_${entry.name}`"
                                    tabindex="-1"
                                />
                            </div>
                        </label>
                    </div>
                </div>
                <!-- Single param (skip non-first members of color groups) -->
                <div
                    v-else-if="!isInColorGroup(name) && shouldShowParam(name, param)"
                    class="flex pb-1"
                    :class="{
                        'flex-col items-start w-full': ![TModifierType.boolean, TModifierType.number].includes(
                            param.type
                        ),
                        'flex-row items-center w-24': [TModifierType.number].includes(param.type),
                        'flex-row items-center w-full': [TModifierType.boolean].includes(param.type),
                        'w-full': [TModifierType.string].includes(param.type),
                    }"
                >
                    <div
                        v-if="param.type == TModifierType.color"
                        class="flex gap-2 items-center"
                    >
                        <label class="input input-sm p-0">
                            {{ LABELS[name] ?? name }}
                        </label>
                        <SwitchInputVariable
                            v-if="!param.fixed"
                            :disabled="readonly"
                            :value="param.getVariable(name)"
                            @change="onChangeVariable($event, param, name)"
                        />
                    </div>
                    <label
                        class="flex gap-2 text-sm"
                        :class="{
                            'input items-center input-bordered input-sm w-24 text-neutral-600 relative':
                                param.type == TModifierType.number,
                            'input items-center input-bordered input-sm w-full relative':
                                param.type == TModifierType.string && !isTextAreaTextParam(name, param),
                            'flex flex-col w-full relative': isTextAreaTextParam(name, param),
                            'w-full items-center': [TModifierType.boolean, TModifierType.font].includes(param.type),
                            'w-full flex-col': [TModifierType.color].includes(param.type),
                        }"
                    >
                        <div v-if="
                            ![TModifierType.boolean, TModifierType.string, TModifierType.color].includes(param.type)
                        ">
                            {{ LABELS[name] ?? name }}
                        </div>
                        <template v-if="param.type == TModifierType.number">
                            <input
                                :disabled="readonly"
                                class="text-gray-300 w-14 pr-1"
                                :class="{ 'text-neutral-500': readonly || !param.setValue || !param.setValue }"
                                type="number"
                                :value="param.getValue()"
                                @change="onChange($event, param)"
                                :readonly="!param.setValue"
                                :id="`inspector_${param.type}_${name}`"
                                tabindex="-1"
                            />
                            <SwitchInputVariable
                                :key="immidiateUpdates + '_' + name"
                                absolute
                                v-if="!param.fixed"
                                :disabled="readonly"
                                :value="param.getVariable(name)"
                                @change="onChangeVariable($event, param, name)"
                            />
                        </template>
                        <template v-else-if="param.type == TModifierType.boolean">
                            <input
                                :disabled="readonly"
                                class="checkbox checkbox-sm checkbox-primary no-animation"
                                type="checkbox"
                                :checked="param.getValue()"
                                @change="onChange($event, param)"
                                :readonly="!param.setValue"
                                :id="`inspector_${param.type}_${name}`"
                                :key="immidiateUpdates + '_' + name"
                                tabindex="-1"
                            />
                        </template>

                        <template v-else-if="param.type == TModifierType.string">
                            <!-- Use multiline input for text area layer text. -->
                            <textarea
                                v-if="isTextAreaTextParam(name, param)"
                                ref="textInputRef"
                                :disabled="readonly"
                                placeholder="Enter text..."
                                class="textarea textarea-bordered textarea-sm w-full leading-tight"
                                :class="{ 'text-white': readonly }"
                                :value="param.getValue()"
                                @input="onChange($event, param)"
                                :readonly="!param.setValue"
                                rows="4"
                                tabindex="-1"
                            ></textarea>
                            <input
                                v-else
                                ref="textInputRef"
                                :disabled="readonly"
                                placeholder="Enter text..."
                                class="w-full pr-1"
                                :class="{ 'text-white': readonly }"
                                type="text"
                                :value="param.getValue()"
                                @input="onChange($event, param)"
                                :readonly="!param.setValue"
                                tabindex="-1"
                            />
                            <SwitchInputVariable
                                absolute
                                :disabled="readonly"
                                :value="param.getVariable('text')"
                                @change="onChangeVariable($event, param, 'text')"
                            />
                        </template>
                        <div v-else-if="param.type == TModifierType.color">
                            <div
                                class="color-palette"
                                v-if="palette && palette.length"
                                :key="immidiateUpdates + '_' + name"
                            >
                                <div
                                    v-for="color in palette"
                                    class="color-palette-box"
                                    @click="onChange($event, param, color)"
                                    :style="{ backgroundColor: color }"
                                    :class="{ selected: color === param.getValue() }"
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
                                tabindex="-1"
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
                            <span
                                v-if="TOOLTIPS[name]"
                                class="tooltip tooltip-bottom"
                                :data-tip="TOOLTIPS[name]"
                            >
                                {{ LABELS[name] ?? name }}
                            </span>
                            <span v-else>
                                {{ LABELS[name] ?? name }}
                            </span>
                        </template>
                    </label>
                </div>
            </template>
        </div>
        <ImageOperations
            v-if="!readonly"
            :actions="actions"
            :activeLayer="activeLayer"
            :project_id="project.id"
        />
    </div>
    <div
        v-if="(activeLayer && !['icon', 'paint'].includes(activeLayer.getType())) || layerToMerge"
        class="flex flex-row gap-2"
    >
        <Button
            v-if="!readonly"
            @click="mergeLayers"
            title="Merge layers into a single bitmap"
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
<style
    lang="css"
    scoped
>
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
    column-gap: 3px;
    row-gap: 5px;
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
