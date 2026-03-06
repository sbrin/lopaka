<script lang="ts" setup>
import {computed, onMounted, onUnmounted} from 'vue';
import Icon from '/src/components/layout/Icon.vue';
import {useSession} from '../../core/session';
import {SCALE_LIST} from '/src/const';

const session = useSession();

const selectedScale = computed({
    get: () => session.state.scaleIndex,
    set: (val: number) => {
        session.setScale(SCALE_LIST[val], true);
    },
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
    session.scaleDown();
}

function scaleUp() {
    session.scaleUp();
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
            :data-tip="`${SCALE_LIST[selectedScale]}%`"
        >
            <input
                class="range range-xs w-32"
                type="range"
                min="0"
                :max="SCALE_LIST.length - 1"
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
