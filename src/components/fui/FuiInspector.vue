<script lang="ts" setup>
import {computed, defineProps} from 'vue';
import FuiInspectorInput from './FuiInspectorInput.vue';

const props = defineProps<{
    elem: any;
    library: string;
}>();

const emit = defineEmits(['updateCurrentLayer', 'redrawCanvas', 'saveLayers', 'updateCode']);

// computed
const isHWVisible = computed(() => {
    // return true;
    return ['frame', 'box', 'draw', 'icon'].includes(props.elem.type);
});

const isHWDisabled = computed(() => {
    return ['draw', 'icon'].includes(props.elem.type);
});

const isRadiusVisible = computed(() => {
    return ['circle', 'disc'].includes(props.elem.type);
});

// methods
function update(element) {
    emit('updateCurrentLayer', element);
    emit('redrawCanvas');
    emit('saveLayers');
    emit('updateCode');
}
</script>
<template>
    <div class="inspector" v-if="elem">
        <div class="title inspector__title">{{ elem.name || elem.type }}</div>
        <div class="inspector__row">
            <div>
                x:
                <FuiInspectorInput :element="elem" field="x" type="number" @update="update"></FuiInspectorInput>
            </div>
            <div v-if="typeof elem.x2 === 'number'">
                x2:
                <FuiInspectorInput :element="elem" field="x2" type="number" @update="update"></FuiInspectorInput>
            </div>
            <div v-if="typeof elem.width === 'number' && isHWVisible">
                w:
                <FuiInspectorInput
                    :element="elem"
                    field="width"
                    type="number"
                    @update="update"
                    :disabled="isHWDisabled"
                ></FuiInspectorInput>
            </div>
            <div v-if="typeof elem.radius === 'number' && isRadiusVisible">
                r:
                <FuiInspectorInput :element="elem" field="radius" type="number" @update="update"></FuiInspectorInput>
            </div>
        </div>
        <div class="inspector__row">
            <div>
                y:
                <FuiInspectorInput :element="elem" field="y" type="number" @update="update"></FuiInspectorInput>
            </div>
            <div v-if="typeof elem.y2 === 'number'">
                y2:
                <FuiInspectorInput :element="elem" field="y2" type="number" @update="update"></FuiInspectorInput>
            </div>
            <div v-if="typeof elem.height === 'number' && isHWVisible">
                h:
                <FuiInspectorInput
                    :element="elem"
                    field="height"
                    type="number"
                    @update="update"
                    :disabled="isHWDisabled"
                ></FuiInspectorInput>
            </div>
        </div>
        <div class="inspector__row" v-if="elem.font">
            <FuiInspectorInput
                :element="elem"
                field="font"
                :library="library"
                type="select"
                @update="update"
            ></FuiInspectorInput>
        </div>
        <div class="inspector__row">
            <template v-if="elem.type === 'str'">
                <FuiInspectorInput
                    :element="elem"
                    field="text"
                    :library="library"
                    type="text"
                    @update="update"
                ></FuiInspectorInput>
            </template>
            <template v-if="elem.type === 'icon'">
                <FuiInspectorInput
                    :element="elem"
                    field="isOverlay"
                    type="checkbox"
                    @update="update"
                    id="inspector_is_overlay"
                ></FuiInspectorInput>
                <label
                    for="inspector_is_overlay"
                    title="Image will be skipped from b&w masking and code generation, you will not see it on your device"
                >
                    Overlay (ignore)
                </label>
            </template>
        </div>
    </div>
</template>
<style lang="css"></style>
