<script lang="ts" setup>
import {toRefs} from 'vue';
import {useSession} from '../../core/session';
import FuiButton from './FuiButton.vue';
import {AbstractTool} from '../../editor/tools/abstract.tool';

const emit = defineEmits(['toolClicked']);
const session = useSession();
const {tools} = session.editor;
const {activeTool} = toRefs(session.editor.state);

function setActive(tool: AbstractTool) {
    activeTool.value = tool;
}

function isActive(name: string) {
    return activeTool.value?.getName() === name;
}
</script>
<template>
    <div class="tools">
        <FuiButton class="tools__btn" @click="setActive(null)" :active="activeTool == null">select</FuiButton>
        <FuiButton
            v-for="(tool, idx) in tools"
            :key="idx"
            class="tools__btn"
            @click="setActive(tool)"
            :active="isActive(tool.getName())"
        >
            {{ tool.getName() }}
        </FuiButton>
    </div>
</template>
<style lang="css"></style>
../../draw/tools/abstract.tool ../../editor/tools/abstract.tool
