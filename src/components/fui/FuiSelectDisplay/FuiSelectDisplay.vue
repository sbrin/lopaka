<script lang="ts" setup>
import {computed, ref, toRefs} from 'vue';
import {useSession} from '../../../core/session';
import FuiPopup from '../FuiPopup.vue';
import FuiDisplayCustomDialog from './FuiDisplayCustomDialog.vue';
import {Display} from '/src/core/displays';
import {InkplatePlatform} from '/src/platforms/inkplate';

const session = useSession();
const {setDisplay, saveDisplayCustom, getDisplays} = session;
const {display, isDisplayCustom, platform} = toRefs(session.state);

const showCustomDisplayPopup = ref(false);
const customWidth = ref(display.value.x);
const customHeight = ref(display.value.y);
const displays = computed(() => getDisplays(platform.value));
const selectedDisplay = ref(
    isDisplayCustom.value ? 'custom' : displays.value.findIndex((d) => d.size.equals(display.value))
);
const lastDisplay = ref(selectedDisplay.value);

function selectDisplay(event) {
    if (event.target.value === 'custom') {
        enablePopup();
    } else {
        selectedDisplay.value = event.target.value;
        lastDisplay.value = selectedDisplay.value;
        setDisplay(displays.value[selectedDisplay.value].size, true);
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
    const defaultIndex = platform.value === InkplatePlatform.id ? 0 : 23;
    const displayToSet: Display =
        lastDisplay.value === 'custom' ? displays.value[defaultIndex] : displays.value[lastDisplay.value];
    selectedDisplay.value = defaultIndex;
    setDisplay(displayToSet.size);
    saveDisplayCustom(false);
}

function setCustomDisplay() {
    showCustomDisplayPopup.value = false;
    selectedDisplay.value = 'custom';
}
</script>
<template>
    <div class="fui-displays fui-select">
        <label
            for="display-size"
            class="fui-select__label"
        >
            Display:
        </label>
        <div
            v-if="isDisplayCustom"
            class="custom-value"
        >
            <span
                @click="enablePopup"
                class="link link-primary"
            >
                Custom {{ display.x }}x{{ display.y }}
            </span>
            <span
                @click="resetDisplay"
                class="text-lg text-error pl-1 cursor-pointer"
                title="Reset display"
            >
                ×
            </span>
        </div>
        <select
            v-else
            id="display-size"
            class="fui-select__select fui-form-input"
            @change="selectDisplay"
            :value="selectedDisplay"
        >
            <option
                key="custom"
                value="custom"
            >
                Custom...
            </option>
            <option
                v-for="(item, idx) in displays"
                :key="idx"
                :value="idx"
            >
                {{ item.title }}
            </option>
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
