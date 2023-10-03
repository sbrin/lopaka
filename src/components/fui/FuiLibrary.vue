<script lang="ts" setup>
import {useSession} from '../../core/session';
import {toRefs} from 'vue';
import {LIBRARIES} from '../../const';

const libs = LIBRARIES;
const {platform} = toRefs(useSession());

function onSelect(e) {
    platform.value = new LIBRARIES[e.target.value]();
}
</script>
<template>
    <div class="fui-select">
        <label for="library" class="fui-select__label">Library:</label>
        <select id="library" class="fui-select__select input-select" :value="platform.getName()" @input="onSelect">
            <option v-for="(lib, idx) in Object.keys(libs)" :key="idx" :value="lib">
                {{ libs[lib].id }}
            </option>
        </select>
    </div>
</template>
<style lang="css"></style>
