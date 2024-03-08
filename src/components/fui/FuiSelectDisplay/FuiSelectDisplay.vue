<script lang="ts" setup>
import {ref, toRefs} from 'vue';
import {useSession} from '../../../core/session';
import FuiPopup from '../FuiPopup.vue';
import FuiDisplayCustomDialog from './FuiDisplayCustomDialog.vue';

const session = useSession();
const {displays, setDisplay, saveDisplayCustom} = session;
const {display, isDisplayCustom} = toRefs(session.state);

const selectedDisplay = ref(isDisplayCustom.value ? 'custom' : displays.findIndex((d) => d.equals(display.value)));
const showCustomDisplayPopup = ref(false);
const customWidth = ref(display.value.x);
const customHeight = ref(display.value.y);
const lastDisplay = ref(selectedDisplay.value);

function selectDisplay(event) {
    if (event.target.value === 'custom') {
        enablePopup();
    } else {
        selectedDisplay.value = event.target.value;
        lastDisplay.value = selectedDisplay.value;
        setDisplay(displays[selectedDisplay.value], true);
    }
}

function cancelPopup() {
    showCustomDisplayPopup.value = false;
}

function enablePopup() {
    customWidth.value = display.value.x;
    customHeight.value = display.value.y;
    showCustomDisplayPopup.value = true;
}

function resetDisplay() {
    // after page refresh, if it was custom then reset to 128×64
    const displayToSet = lastDisplay.value === 'custom' ? displays[23] : displays[lastDisplay.value];
    selectedDisplay.value = 23;
    setDisplay(displayToSet);
    saveDisplayCustom(false);
}

function setCustomDisplay() {
    showCustomDisplayPopup.value = false;
    selectedDisplay.value = 'custom';
}
</script>
<template>
    <div class="fui-displays fui-select">
        <label for="display-size" class="fui-select__label">Display:</label>
        <div v-if="isDisplayCustom" class="custom-value">
            <a @click="enablePopup" href="#">Custom {{ display.x }}x{{ display.y }}</a>
            <span @click="resetDisplay" class="custom-value__reset" title="Reset display">×</span>
        </div>
        <select
            v-else
            id="display-size"
            class="fui-select__select fui-form-input"
            @change="selectDisplay"
            :value="selectedDisplay"
        >
            <option key="custom" value="custom">Custom...</option>
            <option v-for="(item, idx) in displays" :key="idx" :value="idx">{{ item.x }}x{{ item.y }}</option>
        </select>
    </div>
    <FuiPopup v-if="showCustomDisplayPopup">
        <FuiDisplayCustomDialog
            @cancel-popup="cancelPopup"
            @set-custom-display="setCustomDisplay"
        ></FuiDisplayCustomDialog>
    </FuiPopup>
</template>
<style lang="css" scoped>
.fui-displays {
    display: flex;
    align-items: center;
}
.custom-value {
    font-size: 24px;
    margin-left: 8px;
}
.custom-value * {
    line-height: 16px;
}
.custom-value__reset {
    color: var(--danger-color);
    margin: 0 8px;
    cursor: pointer;
}
</style>
