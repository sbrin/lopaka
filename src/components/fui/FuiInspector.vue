<script lang="ts" setup>
import {computed, toRefs} from 'vue';
import {useSession} from '../../core/session';
import {ToolParamType} from '../../draw/tools/tool';

const {platform, activeLayer, activeTool} = toRefs(useSession());

const params = computed(() => {
    return activeTool.value.getParams();
});
</script>
<template>
    <div class="inspector" v-if="activeLayer">
        <div class="title inspector__title">{{ activeLayer.name || activeLayer.type }}</div>
        <div class="inspector__row">
            <div v-for="param in params">
                <span>{{ param.name }}</span>
                <input
                    class="inspector__input"
                    v-if="param.type == ToolParamType.number"
                    type="number"
                    :value="param.value"
                    @change="param.onChange($event.target.value)"
                />
                <input
                    class="inspector__input"
                    v-else-if="param.type == ToolParamType.string"
                    type="text"
                    :value="param.value"
                    @change="param.onChange($event.target.value)"
                />
                <input
                    class="inspector__input"
                    v-else-if="param.type == ToolParamType.boolean"
                    type="checkbox"
                    :checked="param.value"
                    @change="param.onChange($event.target.checked)"
                />
                <select
                    class="inspector__input"
                    v-else-if="param.type == ToolParamType.font"
                    :value="param.value"
                    @change="param.onChange($event.target.value)"
                >
                    <option v-for="font in platform.getFonts()" :value="font.name">{{ font.name }}</option>
                </select>
            </div>
            <!-- <div>
                x:
                <FuiInspectorInput field="x" type="number"></FuiInspectorInput>
            </div>
            <div v-if="typeof activeLayer.size.x === 'number'">
                x2:
                <FuiInspectorInput field="x2" type="number"></FuiInspectorInput>
            </div>
            <div v-if="typeof activeLayer.size.x === 'number' && isHWVisible">
                w:
                <FuiInspectorInput field="width" type="number" :disabled="isHWDisabled"></FuiInspectorInput>
            </div>
            <div v-if="typeof activeLayer.size.x === 'number' && isRadiusVisible">
                r:
                <FuiInspectorInput field="radius" type="number" @update="update"></FuiInspectorInput>
            </div> -->
        </div>
        <div class="inspector__row">
            <!-- <div>
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
            </div> -->
        </div>
        <!-- <div class="inspector__row" v-if="elem.font">
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
        </div> -->
    </div>
</template>
<style lang="css"></style>
