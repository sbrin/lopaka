<script lang="ts" setup>
import {defineProps, ref, toRefs} from 'vue';
import {useSession} from '../../core/session';
import {loadImageAsync, logEvent, readFileAsync, readTextFileAsync} from '../../utils';
import FuiImportWizard from './FuiImportWizard.vue';

const props = defineProps<{
    title: string;
    active?: boolean;
    type?: 'image' | 'code';
}>();

const emit = defineEmits(['updateFuiImages', 'setActiveTab']);

const fileInput = ref(null);

const session = useSession();
const {customImages} = toRefs(session.state);
const fileLoadedCounter = ref(0);
const openWizard = ref(false);
const wizardRef = ref(null);

async function onFileChange(e) {
    const file = e.target.files[0];
    if (!file.name) {
        return;
    }
    if (props.type === 'image') {
        const name = file.name.substr(0, file.name.lastIndexOf('.')) || file.name; // remove file extension
        const fileResult = await readFileAsync(file);
        const image = await loadImageAsync(fileResult);
        openWizard.value = true;
        wizardRef.value.setImage(image, name);
    } else {
        const fileResult = await readTextFileAsync(file);
        session.importCode(fileResult);
        emit('setActiveTab', 'code');
    }
    resetFileInput();
}

function saveImage(image: HTMLImageElement, name: string, width: number, height: number) {
    const nameRegex = new RegExp(`^${name}(_\\d+)?$`);
    const founded = customImages.value.filter((item) => nameRegex.test(item.name));
    if (founded.length > 0) {
        const last = founded[founded.length - 1];
        const lastNumber = last.name.match(/_(\d+)$/);
        const number = lastNumber ? parseInt(lastNumber[1]) + 1 : 1;
        name = `${name}_${number}`;
    }
    customImages.value.push({name, width, height, image, isCustom: true});
    emit('updateFuiImages', customImages.value);
    emit('setActiveTab', 'images');
    openWizard.value = false;
}

function resetFileInput() {
    fileInput.value = null;
    fileLoadedCounter.value++;
    logEvent('button_import_image');
}
</script>
<template>
    <label class="button" :class="{button_active: active}">
        <FuiImportWizard
            v-if="type == 'image'"
            ref="wizardRef"
            :visible="openWizard"
            @onClose="() => (openWizard = false)"
            @onSave="saveImage"
        />
        <input
            type="file"
            style="position: fixed; top: -100%"
            :accept="props.type === 'image' ? 'image/*' : '.c,.cpp,.ino,.txt'"
            @change="onFileChange"
            ref="fileInput"
            :key="fileLoadedCounter"
        />
        {{ title }}
    </label>
</template>
<style lang="css"></style>
