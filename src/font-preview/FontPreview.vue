<script lang="ts" setup>
import FontRender from './FontRender.vue';
// load bdf files from html open file dialog
import {ref} from 'vue';
import {BDFFont} from '../draw/fonts/bdf.font';
const u8g2Fonts = ref<BDFFont[]>([]);
const fileInput = ref<HTMLInputElement | null>(null);
const loadFonts = async () => {
    u8g2Fonts.value = [];
    if (fileInput.value?.files) {
        for (let i = 0; i < fileInput.value.files.length; i++) {
            const file = fileInput.value.files[i];
            const font = new BDFFont(file, file.name, null);
            u8g2Fonts.value.push(font);
        }
    }
};
</script>
<template>
    <div>
        <input type="file" ref="fileInput" multiple @change="loadFonts" />
        <FontRender v-for="font in u8g2Fonts" :font="font as any" />
    </div>
</template>
<style scoped></style>
