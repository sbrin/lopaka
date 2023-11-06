<script lang="ts" setup>
import {computed, toRefs} from 'vue';
import {useSession} from '../../core/session';
import {AbstractTool} from '../../editor/tools/abstract.tool';
import FuiButton from './FuiButton.vue';

const emit = defineEmits(['toolClicked']);
const session = useSession();
const {platform} = toRefs(session.state);
const tools = computed(() => session.editor.getSupportedTools(platform.value));
const {activeTool} = toRefs(session.editor.state);

function setActive(tool: AbstractTool) {
    session.editor.setTool(tool?.getName());
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
