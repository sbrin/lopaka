<script lang="ts" setup>
import {ref} from 'vue';
import ImportImageWizard from '/src/components/fui/importImage/ImportImageWizard.vue';
import Icon from '/src/components/layout/Icon.vue';
import Button from '/src/components/layout/Button.vue';
import {addCustomImage, useSession} from '/src/core/session';

const props = defineProps<{
    isSandbox: boolean;
}>();

const isWizardOpen = ref(false);

const emit = defineEmits(['setActiveTab', 'uploading']);

function open() {
    isWizardOpen.value = true;
}
function close() {
    isWizardOpen.value = false;
}

async function saveImage(processedImagesArr) {
    if (props.isSandbox) {
        for (const [name, width, height, image] of processedImagesArr) {
            addCustomImage(name, width, height, image, false);
        }
    } else {
        const uploadPromises = processedImagesArr.map(async ([name, width, height, image]) => {
            const file = await fetch(image.src)
                .then((res) => res.blob())
                .then((blob) => new File([blob], name, {type: 'image/png'}));
            addCustomImage(name, width, height, image, false);
        });

        await Promise.all(uploadPromises);
    }
    emit('setActiveTab', 'images');
    isWizardOpen.value = false;
}
</script>

<template>
    <ImportImageWizard
        v-if="isWizardOpen"
        ref="wizardRef"
        @onClose="close"
        @onSave="saveImage"
    />
    <Button
        @click="open"
        :disabled="isWizardOpen"
    >
        <Icon
            type="photo"
            pointer
        />
        Add image
    </Button>
</template>

<style></style>
