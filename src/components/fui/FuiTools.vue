<script lang="ts" setup>
import {toRefs} from 'vue';
import {useSession} from '../../core/session';
import FuiButton from './FuiButton.vue';

const emit = defineEmits(['toolClicked']);
const session = useSession();
const {tools} = session;
const {activeTool} = toRefs(session.state);

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
            @click="activeTool = tool"
            :title="tool.getName()"
            :active="isActive(tool.getName())"
        ></FuiButton>
        <!-- <FuiButton
            class="tools__btn"
            @click="setActiveTool('str')"
            title="string"
            :active="isActive('text')"
        ></FuiButton>
        <FuiButton
            class="tools__btn"
            @click="setActiveTool('select')"
            title="select"
            :active="isActive('select')"
        ></FuiButton> -->
    </div>
</template>
<style lang="css"></style>
