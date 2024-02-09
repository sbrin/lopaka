<script lang="ts" setup>
const props = defineProps<{
    font: BDFFont;
}>();
import {ref, onMounted, nextTick} from 'vue';
import {DrawContext} from '../draw/draw-context';
import {BDFFont} from '../draw/fonts/bdf.font';
import {Point} from '../core/point';
const canvas = ref<HTMLCanvasElement | null>(null);
const width = ref('0px');
const height = ref('0px');
const scale = 2;
onMounted(() => {
    props.font.fontReady.then(() => {
        const ctx = canvas.value?.getContext('2d');
        const text = 'AaBbCcDdEeFfGgHhIiJjKkLlMmNnOoPpQqRrSsTtUuVvWwXxYyZz0123456789!@#$%^&*()_+-={}[]|\\:;\'"<>,.?/`~';
        // Array.from(props.font.glyphs.values())
        //     .map((f) => f.char)
        //     .join();
        const size = props.font.getSize(null, text);
        size.add(24);
        if (size.x && size.y) {
            width.value = size.x * scale + 'px';
            height.value = size.y * scale + 'px';
            setTimeout(() => {
                const offCanvas = new OffscreenCanvas(size.x, size.y);
                const dc = new DrawContext(offCanvas);
                props.font.drawText(dc, text, new Point(0, size.y - 12));
                ctx?.drawImage(offCanvas, 0, 0, size.x, size.y);
            }, 100);
        }
    });
});
</script>
<template>
    <div>
        <h2>{{ props.font.name }}</h2>
        <canvas style="" ref="canvas" :width="parseInt(width) / scale" :height="parseInt(height) / scale"></canvas>
    </div>
</template>
<style scoped>
canvas {
    width: v-bind(width);
    height: v-bind(height);
    image-rendering: pixelated;
}
</style>
