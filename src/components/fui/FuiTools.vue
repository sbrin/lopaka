<script lang="ts" setup>
import {computed, toRefs} from 'vue';
import {useSession} from '../../core/session';
import FuiButton from './FuiButton.vue';
import {Tool} from '../../draw/tools/tool';
import { FlipperPlatform } from "../../platforms/flipper";

const emit = defineEmits(['toolClicked']);
const session = useSession();
const {tools} = session;
const {activeTool, platform} = toRefs(session.state);

const toolsList = computed(() => {
    const toolsFiltered = [];
    for (let key in tools) {
        if (
            (platform.value !== FlipperPlatform.id || key !== "paint")
            && key !== "icon"
        ) {
            toolsFiltered.push(tools[key]);
        }
    }
    return toolsFiltered;
})

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
            v-for="(tool, idx) in toolsList"
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
