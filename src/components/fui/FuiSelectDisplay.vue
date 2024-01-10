<script lang="ts" setup>
import {ref, toRefs, watch} from 'vue';
import {useSession} from '../../core/session';
import FuiPopup from "./FuiPopup.vue";
import { Point } from "../../core/point";

const session = useSession();
const {displays, setDisplay} = session;
const {display} = toRefs(session.state);
const selectedDisplay = ref(displays.findIndex((d) => d.equals(display.value)) ?? "custom");
const showCustomDisplayPopup = ref(false);
const customWidth = ref(128);
const customHeight = ref(64);
const lastDisplay = ref();

function disablePopup() {
    showCustomDisplayPopup.value = false;
    setDisplay(lastDisplay.value);
}

function setCustomDisplay() {
    showCustomDisplayPopup.value = false;
    setDisplay(new Point(customWidth.value, customHeight.value));
}

watch(selectedDisplay, (val, oldVal) => {
    if (val === "custom") {
        showCustomDisplayPopup.value = true;
        lastDisplay.value = displays[oldVal];
    } else {
        setDisplay(displays[val], true);
    }
});
</script>
<template>
    <div class="fui-displays fui-select">
        <label for="display-size" class="fui-select__label">Display:</label>
        <select id="display-size" class="fui-select__select input-select" v-model="selectedDisplay">
            <option key="custom" value="custom">Custom...</option>
            <option v-for="(item, idx) in displays" :key="idx" :value="idx">{{ item.x }}x{{ item.y }}</option>
        </select>
    </div>
    <FuiPopup v-if="showCustomDisplayPopup">
        <div class="form-row">
            <label for="displayCustomWidth">Width:
                <input type="number" v-model="customWidth" id="displayCustomWidth"/>
            </label>
            <label for="displayCustomWidth">Width:
                <input type="number" v-model="customHeight" id="displayCustomHeight"/>
            </label>
        </div>
        <div class="buttons-bottom">
            <button class="button button_danger" @click="disablePopup">Cancel</button>
            <button class="button" @click="setCustomDisplay">Save</button>
        </div>
    </FuiPopup>
</template>
<style lang="css"></style>