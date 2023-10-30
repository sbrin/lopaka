<script lang="ts" setup>
import {toRefs} from 'vue';
import {useSession} from '../../core/session';
import FuiButton from './FuiButton.vue';
import {Tool} from '../../draw/tools/tool';

const emit = defineEmits(['toolClicked']);
const session = useSession();
const {tools} = session;
const {activeTool, activeLayer} = toRefs(session.state);

function setActive(tool: Tool) {
    activeTool.value = tool;
}

function isActive(name: string) {
    return activeTool.value.getName() === name;
}
</script>
<template>
    <div class="tools">
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
