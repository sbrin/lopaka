<script lang="ts" setup>
import {ref, onMounted, nextTick, computed} from 'vue';
import {DrawContext} from '/src/draw/draw-context';
import {BDFFont} from '/src/draw/fonts/bdf.font';
import {Point} from '../core/point';
import {Rect} from '../core/rect';
// import {encodeGFX} from '/src/draw/fonts/gfx-parser';
import {encodeBDF} from '/src/draw/fonts/bdf-parser';
import {createGFXFont} from 'truetype2gfx';
const props = defineProps<{
    font: BDFFont;
    showBounds: boolean;
}>();
const canvas = ref<HTMLCanvasElement | null>(null);
const width = ref('0px');
const height = ref('0px');
const scale = 2;
const lineHeight = ref('');
const offsetY = ref('');
const baselineColor = computed(() => (props.showBounds ? '#ff3535' : 'transparent'));
const ascenderColor = computed(() => (props.showBounds ? '#00e700' : 'transparent'));
onMounted(() => {
    props.font.fontReady.then(() => {
        const ctx = canvas.value?.getContext('2d');
        const glyphs = [];
        for (let i = 32; i <= 126; i++) {
            glyphs.push(String.fromCharCode(i));
        }
        const text = glyphs.join('');
        const size = props.font.getSize(null, text);

        const padding = Math.ceil(size.y / 2) * 2;
        lineHeight.value = size.y * scale + 0.2 + 'px';
        offsetY.value = size.y + 'px';
        size.add(padding);
        if (size.x && size.y) {
            width.value = size.x * scale + 'px';
            height.value = size.y * scale + 'px';
            setTimeout(() => {
                const offCanvas = new OffscreenCanvas(size.x, size.y);
                const dc = new DrawContext(offCanvas);
                dc.ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';

                props.font.drawText(dc, text, new Point(0, size.y - padding / 2));

                ctx?.drawImage(offCanvas, 0, 0, size.x, size.y);
            }, 100);
        }
    });
});

function exportGFX() {
    const gfxFont = createGFXFont(props.font.fontData);
    exportStringAsFile(props.font.name + '.h', gfxFont.content);
}

function exportBDF() {
    const bdfFont = encodeBDF(props.font.fontData);
    exportStringAsFile(props.font.name + '.bdf', bdfFont);
}

function exportStringAsFile(filename: string, data: string) {
    const blob = new Blob([data], {type: 'text/plain'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.target = '_blank';
    a.click();
    URL.revokeObjectURL(url);
}
</script>
<template>
    <div>
        <h2>{{ props.font.name }}</h2>
        <button @click="exportGFX">export GFX</button>
        <button @click="exportBDF">export BDF</button>
        <div
            class="container"
            :style="{height: height, width: width}"
        >
            <!-- <div class="bounds" :style="{top: bounds.y + 'px', height: bounds.h + 'px', width: bounds.w + 'px'}"></div> -->
            <div class="grid">
                <canvas
                    ref="canvas"
                    :width="parseInt(width) / scale"
                    :height="parseInt(height) / scale"
                ></canvas>
            </div>
        </div>
    </div>
</template>
<style>
html {
    background-color: black;
    color: #fff;
}
</style>
<style scoped>
h2 {
    font-family: 'SF Mono', SFMono-Regular, ui-monospace, 'DejaVu Sans Mono', Menlo, Consolas, monospace;
    color: white;
    font-size: 12px;
}
.container {
    position: relative;
    overflow: hidden;
    background-color: #959595;
}
canvas {
    width: v-bind(width);
    height: v-bind(height);
    image-rendering: pixelated;
    background-color: #000000c9;
}
.bounds {
    position: absolute;
    border: 0.5px dashed yellow;
    box-sizing: border-box;
}
.grid {
    position: absolute;
    inset: 0;

    &::before {
        content: '';
        position: absolute;
        inset: 0;
        background-image: linear-gradient(to right, #000000 0.1px, transparent 0.5px),
            linear-gradient(to bottom, #000000 0.1px, transparent 0.5px);
        background-size: 2px 2px;
        opacity: 0.6;
    }
    &::after {
        content: '';
        position: absolute;
        inset: 0;
        top: v-bind(offsetY);
        height: v-bind(lineHeight);
        mix-blend-mode: color-dodge;
        border: 0.5px ridge transparent;
        border-top-color: v-bind(ascenderColor);
        border-bottom-color: v-bind(baselineColor);
        box-sizing: border-box;
    }
}
</style>
