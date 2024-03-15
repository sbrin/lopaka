<script lang="ts" setup>
import {ComputedRef, UnwrapRef, computed, toRefs} from 'vue';
import {AbstractImageLayer} from '../../core/layers/abstract-image.layer';
import {
    AbstractLayer,
    TLayerAction,
    TLayerModifier,
    TLayerModifiers,
    TModifierType
} from '../../core/layers/abstract.layer';
import {useSession} from '../../core/session';
import {loadFont} from '../../draw/fonts';
import FuiButton from './FuiButton.vue';
import {logEvent} from '../../utils';
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

const layerToMerge = computed(
    () =>
        selectionUpdates.value &&
        session.state.layers.filter((l) => l.selected && l instanceof AbstractLayer).length > 1
);

const fonts = computed(() => {
    return session.platforms[platform.value].getFonts();
});

const palette = computed(() => {
    return session.platforms[platform.value].features.palette;
});

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
            const font = session.platforms[platform.value]
                .getFonts()
                .find((f: TPlatformFont) => f.name === target.value);
            // lock scrteen while loading font
            session.lock();
            loadFont(font).then(() => {
                session.unlock();
                param.setValue(font.name);
                session.virtualScreen.redraw();
            });
            break;
    }
    session.virtualScreen.redraw();
}

function onAction(action: TLayerAction) {
    action.action();
    session.virtualScreen.redraw();
    logEvent('button_inspector_operations', action.title);
}

function mergeLayers() {
    session.mergeLayers(
        (session.state.layers as AbstractLayer[]).filter(
            (l) => l.selected && (!(l instanceof AbstractImageLayer) || !l.overlay)
        )
    );
    logEvent('button_merge');
}

const LABELS = {
    font: 'Font Face',
    text: 'Text',
    inverted: 'XOR Draw',
    fill: 'Filled',
    color: 'Color',
    overlay: 'Overlay',
    radius: 'Radius'
};
</script>
<template>
    <div v-if="layerToMerge">
        <FuiButton @click="mergeLayers" title="Merge selected layers into a single bitmap">Merge to image</FuiButton>
    </div>
    <div class="inspector" v-if="activeLayer">
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
        <div class="title inspector__title">{{ activeLayer.name }}</div>
        <div class="inspector-panel">
            <template v-for="(param, name) in params">
                <div
                    class="inspector-panel__param"
                    v-if="param.type !== TModifierType.image"
                    :class="{
                        'inspector-panel__param_row': [TModifierType.boolean].includes(param.type),
                        'inspector-panel__param_wide': [TModifierType.color, TModifierType.string].includes(param.type)
                    }"
                >
                    <label class="fui-form-label" :for="`inspector_${param.type}_${name}`">
                        {{ LABELS[name] ?? name }}
                    </label>
                    <div v-if="param.type == TModifierType.number">
                        <input
                            :disabled="session.state.isPublic"
                            class="inspector__input fui-form-input"
                            type="number"
                            :value="param.getValue()"
                            @change="onChange($event, param)"
                            :readonly="!param.setValue"
                        />
                    </div>
                    <template v-else-if="param.type == TModifierType.string">
                        <input
                            :disabled="session.state.isPublic"
                            class="inspector__input fui-form-input"
                            type="text"
                            :value="param.getValue()"
                            @keyup="onChange($event, param)"
                            :readonly="!param.setValue"
                        />
                    </template>
                    <div v-else-if="param.type == TModifierType.boolean" class="fui-form-checkbox">
                        <input
                            :disabled="session.state.isPublic"
                            class="inspector__input fui-form-input"
                            type="checkbox"
                            :checked="param.getValue()"
                            @change="onChange($event, param)"
                            :readonly="!param.setValue"
                            :id="`inspector_${param.type}_${name}`"
                            :key="updates + '_' + name"
                        />
                    </div>

                    <div v-else-if="param.type == TModifierType.color">
                        <div class="color-palette" v-if="palette.length" :key="updates + '_' + name">
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
                            :disabled="session.state.isPublic"
                            class="inspector__input fui-form-input"
                            type="color"
                            :value="param.getValue()"
                            @input="onChange($event, param)"
                            :readonly="!param.setValue"
                            list="presetColors"
                            :id="`inspector_${param.type}_${name}`"
                        />
                    </div>
                    <div v-else-if="param.type == TModifierType.font">
                        <select
                            :disabled="session.state.isPublic"
                            class="inspector__input fui-form-input"
                            :value="param.getValue()"
                            :readonly="!param.setValue"
                            @change="onChange($event, param)"
                        >
                            <option v-for="font in fonts" :value="font.name">{{ font.title }}</option>
                        </select>
                    </div>
                </div>
            </template>
        </div>
        <template v-if="!session.state.isPublic">
            <div class="title inspector__title" v-if="actions.length">Image operations</div>
            <div class="inspector-actions">
                <div class="inspector-action-button" v-for="action in actions">
                    <FuiButton
                        :disabled="session.state.isPublic"
                        @click="onAction(action)"
                        :title="action.title"
                        :isIcon="true"
                    >
                        {{ action.label }}
                    </FuiButton>
                </div>
            </div>
        </template>
    </div>
</template>
<style lang="css" scoped>
.inspector {
}
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
    flex-direction: column;
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
    margin-top: 8px;
    width: 150px;
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
