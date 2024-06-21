<script lang="ts" setup>
import {ref, toRefs, watch} from 'vue';
import {Point} from '../../core/point';
import {useSession} from '../../core/session';

const session = useSession();
const {scale} = toRefs(session.state);
const scales = ref([100, 200, 400, 500, 600, 800, 1000]);
const selectedScale = ref(scale.value ? scale.value.x * 100 : 100);

watch(selectedScale, (val) => {
    session.setScale(val, true);
});
</script>
<template>
    <div class="fui-select">
        <label for="canvas-scale" class="fui-select__label pr-2">Scale:</label>
        <select id="canvas-scale" class="fui-select__select fui-form-input" v-model="selectedScale">
            <option v-for="(item, idx) in scales" :key="idx" :value="item">{{ item }}%</option>
        </select>
    </div>
</template>
<style lang="css"></style>
