<script lang="ts" setup>
import {ref, toRefs, watch, onMounted, onUnmounted} from 'vue';
import Icon from '/src/components/layout/Icon.vue';
import {useSession} from '../../core/session';

const scaleList = [25, 50, 100, 200, 300, 400, 800, 1500];
const session = useSession();
const {scale} = toRefs(session.state);
const selectedScale = ref(scale.value ? scaleList.findIndex((x) => x == scale.value.x * 100) : 2);

watch(selectedScale, (val, old) => {
    session.setScale(scaleList[val], true);
});

const handleKeyDown = (event: KeyboardEvent) => {
    if (event.metaKey || event.ctrlKey) {
        if (event.key === '=') {
            event.preventDefault();
            scaleUp();
        }
        if (event.key === '-') {
            event.preventDefault();
            scaleDown();
        }
    }
};

function scaleDown() {
    selectedScale.value = Math.max(selectedScale.value - 1, 0);
}

function scaleUp() {
    selectedScale.value = Math.min(selectedScale.value + 1, scaleList.length - 1);
}

onMounted(() => {
    window.addEventListener('keydown', handleKeyDown);
});

onUnmounted(() => {
    window.removeEventListener('keydown', handleKeyDown);
});
</script>
<template>
    <div class="flex flex-row items-center mr-16">
        <label
            for="canvas-scale"
            class="text-sm pr-1 pb-1"
            @click="scaleDown"
        >
            <Icon
                type="zoom-out"
                sm
            />
        </label>
        <div
            class="tooltip tooltip-right"
            :data-tip="`${scaleList[selectedScale]}%`"
        >
            <input
                class="range range-xs w-32"
                type="range"
                min="0"
                :max="scaleList.length - 1"
                step="1"
                v-model="selectedScale"
                id="canvas-scale"
                @dblclick="selectedScale = 2"
            />
        </div>
        <label
            for="canvas-scale"
            class="text-sm pl-1 pb-1"
            @click="scaleUp"
        >
            <Icon
                type="zoom-in"
                sm
            />
        </label>
    </div>
</template>
<style lang="css"></style>
