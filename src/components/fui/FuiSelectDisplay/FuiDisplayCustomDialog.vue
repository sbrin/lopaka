<script lang="ts" setup>
import {ref, toRefs} from 'vue';
import {useSession} from '../../../core/session';
import {Point} from '../../../core/point';
import Button from '/src/components/layout/Button.vue';

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
    emit('setCustomDisplay');
    const displayCustom = new Point(customWidth.value || 1, customHeight.value || 1);
    setDisplay(displayCustom, true);
    saveDisplayCustom(true);
}
</script>
<template>
    <div class="fui-display-custom-dialog">
        <div class="font-bold text-lg pb-4">Set display size</div>
        <div class="fui-form-row">
            <label
                class="fui-form-label fui-form-column"
                for="displayCustomWidth"
            >
                Width:
                <input
                    class="fui-form-input fui-form-input__size"
                    type="number"
                    v-model="customWidth"
                    id="displayCustomWidth"
                />
            </label>
            <label
                class="fui-form-label fui-form-column"
                for="displayCustomWidth"
            >
                Height:
                <input
                    class="fui-form-input fui-form-input__size"
                    type="number"
                    min="1"
                    v-model="customHeight"
                    id="displayCustomHeight"
                />
            </label>
        </div>
        <div class="buttons-bottom">
            <Button @click="cancelPopup">Cancel</Button>
            <Button
                @click="setCustomDisplay"
                :success="true"
            >
                Save
            </Button>
        </div>
    </div>
</template>
<style lang="css" scoped>
.fui-form-input__size {
    width: 68px;
}
</style>
