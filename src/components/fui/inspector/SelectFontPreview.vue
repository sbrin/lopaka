<script lang="ts" setup>
import {computed, onMounted, ref} from 'vue';
import {GFXFont} from '/src/draw/fonts/gfx.font';
import {DrawContext} from '/src/draw/draw-context';
import {Point} from '/src/core/point';

const props = defineProps<{
    font: GFXFont;
    scale: number;
    text: string;
}>();
const canvas = ref<HTMLCanvasElement | null>(null);
const width = ref('0px');
const height = ref('0px');
const lineHeight = ref('');
const offsetY = ref('');

const scaleGridSize = computed(() => `${props.scale}px ${props.scale}px`);

onMounted(() => {
    props.font.fontReady.then(() => {
        const ctx = canvas.value?.getContext('2d');
        const glyphs = [];
        for (let i = 32; i <= 126; i++) {
            glyphs.push(String.fromCharCode(i));
        }
        const text = glyphs.join('');
        // const text = '!ABCD';

        // Split text into lines at 'a' characters, keeping the 'a'
        const lines = props.text
            ? [props.text]
            : [...text.match(/.{1,33}/), ...text.match(/A.{1,31}/), ...text.match(/a.{1,}/)];
        const lineCount = lines.length;

        // Get size for a single line
        const singleLineSize = props.font.getSize(null, lines[0]);
        const lineHeightWithPadding = singleLineSize.y + 5; // Add 5px padding top and bottom
        const totalHeight = lineHeightWithPadding * lineCount;
        let maxWidth = 0;

        // Find max width across all lines
        lines.forEach((line) => {
            const lineSize = props.font.getSize(null, line);
            maxWidth = Math.max(maxWidth, lineSize.x);
        });

        lineHeight.value = lineHeightWithPadding * props.scale + 0.2 + 'px';
        offsetY.value = singleLineSize.y - 0.5 + 'px';

        if (maxWidth && totalHeight) {
            const maxAllowedWidth = 1100;
            const scaledWidth = maxWidth * props.scale;
            width.value = Math.min(scaledWidth, maxAllowedWidth) + 'px';
            height.value = totalHeight * props.scale + 'px';

            setTimeout(() => {
                const offCanvas = new OffscreenCanvas(maxWidth, totalHeight);
                const dc = new DrawContext(offCanvas);
                dc.ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';

                // Draw each line separately
                lines.forEach((line, index) => {
                    const y = (index + 1) * lineHeightWithPadding - 5; // Subtract 5px to center text vertically in padded space
                    props.font.drawText(dc, line, new Point(0, y));
                });

                ctx?.drawImage(offCanvas, 0, 0, maxWidth, totalHeight);
            }, 100);
        }
    });
});
</script>
<template>
    <div class="overflow-hidden">
        <div
            class="container"
            :style="{height: height, width: width}"
        >
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
<style scoped>
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
.grid {
    position: absolute;
    inset: 0;

    &::before {
        content: '';
        position: absolute;
        inset: 0;
        background-image: linear-gradient(to right, #000000 0.1px, transparent 0.5px),
            linear-gradient(to bottom, #000000 0.1px, transparent 0.5px);
        background-size: v-bind(scaleGridSize);
        opacity: 0.6;
    }
}
</style>
