<script lang="ts" setup>
import {defineProps, onMounted, ref} from 'vue';
import {TImage} from '../../core/image-library';
import {unpackImage} from '../../utils';
import {useSession} from '../../core/session';

const props = defineProps<{
    image: TImage;
}>();

const {scale} = useSession().state;

const canvasRef = ref(null);
onMounted(() => {
    const ctx: CanvasRenderingContext2D = canvasRef.value.getContext('2d');
    const image = props.image;
    ctx.save();
    ctx.putImageData(unpackImage(image.data, image.width, image.height), 0, 0);
    ctx.restore();
});
</script>
<template>
    <canvas
        ref="canvasRef"
        v-if="image"
        :width="image.width"
        :height="image.height"
        :style="{
            width: image.width * scale.x + 'px',
            height: image.height * scale.y + 'px',
            opacity: image.unused ? 0.5 : 1
        }"
    ></canvas>
</template>
<style lang="css"></style>
