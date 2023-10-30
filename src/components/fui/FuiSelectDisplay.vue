<script lang="ts" setup>
import {ref, toRefs, watch} from 'vue';
import {useSession} from '../../core/session';

const session = useSession();
const {displays, setDisplay} = session;
const {display} = toRefs(session.state);
const selectedDisplay = ref(displays.findIndex((d) => d.equals(display.value)));
watch(selectedDisplay, (val) => {
    setDisplay(displays[val]);
});
</script>
<template>
    <div class="fui-displays fui-select">
        <label for="display-size" class="fui-select__label">Display:</label>
        <select id="display-size" class="fui-select__select input-select" v-model="selectedDisplay">
            <option v-for="(item, idx) in displays" :key="idx" :value="idx">{{ item.x }}x{{ item.y }}</option>
        </select>
    </div>
</template>
<style lang="css"></style>
