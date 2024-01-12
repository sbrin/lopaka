<script lang="ts" setup>
import {ref, toRefs} from 'vue';
import {useSession} from '../../../core/session';
import { Point } from "../../../core/point";

const session = useSession();
const {setDisplay, saveDisplayCustom} = session;
const {display} = toRefs(session.state);

const emit = defineEmits(['cancelPopup', 'setCustomDisplay']);

const customWidth = ref(display.value.x);
const customHeight = ref(display.value.y);

function cancelPopup() {
    emit('cancelPopup');
}

function setCustomDisplay() {
    emit('setCustomDisplay')
    const displayCustom = new Point(customWidth.value, customHeight.value);
    setDisplay(displayCustom, true);
    saveDisplayCustom(true);
}

</script>
<template>
    <div class="fui-display-custom-dialog">
        <div class="form-row">
            <label for="displayCustomWidth">Width:
                <input type="number" v-model="customWidth" id="displayCustomWidth"/>
            </label>
            <label for="displayCustomWidth">Width:
                <input type="number" v-model="customHeight" id="displayCustomHeight"/>
            </label>
        </div>
        <div class="buttons-bottom">
            <button class="button button_danger fui-display-custom-dialog__cancel" @click="cancelPopup">Cancel</button>
            <button class="button fui-display-custom-dialog__save" @click="setCustomDisplay">Save</button>
        </div>
    </div>
</template>
<style lang="css">

</style>