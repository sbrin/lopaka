<script lang="ts" setup>
import {defineProps, ref} from 'vue';
import {useSession} from '../../core/session';
import {logEvent, readTextFileAsync} from '../../utils';

const props = defineProps<{
    title: string;
    active?: boolean;
    type?: 'image' | 'code';
    project_id?: number;
    isSandbox?: boolean;
}>();

const emit = defineEmits(['setActiveTab', 'uploading']);

const fileInput = ref(null);

const session = useSession();
const fileLoadedCounter = ref(0);
const isLoading = ref(false);

async function onFileChange(e) {
    const file = e.target.files[0];
    if (!file?.name) {
        return;
    }
    const fileResult = await readTextFileAsync(file);
    session.importCode(fileResult, true);
    emit('setActiveTab', 'code');

    isLoading.value = false;
    resetFileInput();
}

function resetFileInput() {
    fileInput.value = null;
    fileLoadedCounter.value++;
}
</script>
<template>
    <label
        class="btn btn-sm btn-outline btn-primary uppercase font-sans overflow-hidden"
        @click="logEvent(`button_import_${type}`)"
    >
        <slot></slot>
        <input
            type="file"
            style="position: fixed; top: -100%"
            :accept="type === 'image' ? 'image/*' : '.c,.cpp,.ino,.txt,.xbm'"
            @change="onFileChange"
            ref="fileInput"
            :key="fileLoadedCounter"
            :multiple="type === 'image'"
            :disabled="isLoading"
        />
        {{ title }}
        <div
            v-if="isLoading"
            class="loading loading-sm loading-spinner"
        ></div>
    </label>
</template>
<style lang="css"></style>
