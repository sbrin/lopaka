<script lang="ts" setup>
import FontRender from './FontRender.vue';
// load bdf files from html open file dialog
import {ref} from 'vue';
import {BDFFont} from '../draw/fonts/bdf.font';
import {GFXFont} from '../draw/fonts/gfx.font';
import {debugCanvas, truetype2gfx} from 'truetype2gfx';

const u8g2Fonts = ref<BDFFont[]>([]);
const fileInput = ref<HTMLInputElement | null>(null);
const showBounds = ref(false);

const pixelHeight = ref(16);

const loadFonts = async () => {
    u8g2Fonts.value = [];
    if (fileInput.value?.files) {
        for (let i = 0; i < fileInput.value.files.length; i++) {
            const file = fileInput.value.files[i];
            let font;
            if (file.name.endsWith('.bdf')) {
                font = new BDFFont(file, file.name, null);
            } else if (file.name.endsWith('.h')) {
                font = new GFXFont(file, file.name, null);
            } else {
                // TTF, OTF, WOFF
                const fontFile = await truetype2gfx(file, pixelHeight.value);
                font = new GFXFont(fontFile, fontFile.name, null);
            }
            font.fontReady.then(() => {
                debugCanvas(font.fontData);
            });
            u8g2Fonts.value.push(font);
        }
    }
};
</script>
<template>
    <div>
        <input
            type="file"
            ref="fileInput"
            multiple
            @change="loadFonts"
        />
        <label>
            <input
                type="checkbox"
                v-model="showBounds"
            />
            Show bounds
        </label>
        <label>
            <input
                type="number"
                v-model="pixelHeight"
                @change="loadFonts"
            />
            TrueType Size
        </label>
        <FontRender
            v-for="font in u8g2Fonts"
            :font="font as any"
            :show-bounds="showBounds"
        />
    </div>
</template>
<style>
canvas {
    image-rendering: pixelated;
    text-rendering: geometricPrecision;
    font-smooth: never;
    -webkit-font-smoothing: none;
}
</style>
