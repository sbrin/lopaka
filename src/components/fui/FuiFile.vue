<script lang="ts" setup>
import {useSession} from '../../core/session';
import {loadImageAsync, readFileAsync} from '../../utils';
import {defineProps, ref, toRefs} from 'vue';

const props = defineProps<{
    title: string;
    active?: boolean;
}>();

const emit = defineEmits(['updateFuiImages', 'setActiveTab']);

const fileInput = ref(null);

const session = useSession();
const {customImages} = toRefs(session.state);

async function onFileChange(e) {
    const file = e.target.files[0];
    if (!file.name) {
        return;
    }
    const name = file.name.substr(0, file.name.lastIndexOf('.')) || file.name; // remove file extension
    const fileResult = await readFileAsync(file);
    const image = await loadImageAsync(fileResult);

    customImages.value.push({
        name: name,
        width: image.width,
        height: image.height,
        image: image,
        isCustom: true
    });
    emit('setActiveTab', 'images');
}

function resetFileInput() {
    fileInput.value = null;
}
</script>
<template>
    <label class="button" :class="{button_active: active}">
        <input
            type="file"
            style="position: fixed; top: -100%"
            @change="onFileChange"
            @click="resetFileInput"
            ref="fileInput"
        />
        {{ title }}
    </label>
</template>
<style lang="css"></style>
