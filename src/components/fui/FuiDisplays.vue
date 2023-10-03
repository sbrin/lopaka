<script lang="ts" setup>
import {ref, toRefs, watch} from 'vue';
import {Point} from '../../core/point';
import {useSession} from '../../core/session';

const session = useSession();
const {setDisplay} = session;
const {displays, display, scale} = toRefs(session);
const selectedDisplay = ref(displays.value.findIndex((d) => d.equals(display.value)));
const scales = ref([100, 200, 400, 500, 600, 800, 1000]);
const selectedScale = ref(200);
watch(selectedDisplay, (val) => {
    setDisplay(displays.value[val]);
});
watch(selectedScale, (val) => {
    scale.value = new Point(val / 100, val / 100);
});
</script>
<template>
    <div class="fui-displays fui-select">
        <label for="display-size" class="fui-select__label">Display:</label>
        <select id="display-size" class="fui-select__select input-select" v-model="selectedDisplay">
            <option v-for="(item, idx) in displays" :key="idx" :value="idx">{{ item.x }}x{{ item.y }}</option>
        </select>
    </div>
    <div class="fui-select">
        <label for="display-size" class="fui-select__label">Scale:</label>
        <select id="display-size" class="fui-select__select input-select" v-model="selectedScale">
            <option v-for="(item, idx) in scales" :key="idx" :value="item">{{ item }}%</option>
        </select>
    </div>
</template>
<style lang="css"></style>
