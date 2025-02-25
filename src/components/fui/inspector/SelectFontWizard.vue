<script lang="ts" setup>
import {onMounted, ref} from 'vue';
import {truetype2gfx, createGFXFont} from 'truetype2gfx';
import {GFXFont} from '/src/draw/fonts/gfx.font';
import Button from '../../layout/Button.vue';
import SelectFontPreview from './SelectFontPreview.vue';
import {debounce} from '/src/utils';

const props = defineProps<{
    font_src: File;
}>();
const emit = defineEmits(['cancel', 'import']);

const pixelHeight = ref(16);
const scale = ref(2);
const fontPack = ref();
const font = ref();
const isReady = ref(false);
const textPreview = ref();

const cancel = () => {
    emit('cancel');
};

const importFont = () => {
    const gfxFont = createGFXFont(fontPack.value);
    const fontFile = new File([gfxFont.content], gfxFont.name + '.h', {type: 'text/plain'});
    emit('import', fontFile);
};

onMounted(async () => {
    await loadFont();
});

const loadFont = debounce(async () => {
    if (props.font_src) {
        isReady.value = false;
        fontPack.value = await truetype2gfx(props.font_src, pixelHeight.value);
        font.value = new GFXFont(fontPack.value, fontPack.value.name, null);
        isReady.value = true;
    }
}, 500);
</script>

<template>
    <Teleport to="body">
        <div class="modal font-sans text-white opacity-100 pointer-events-auto">
            <div class="modal-box mb-20 border border-primary min-w-[1000px] pointer-events-auto opacity-100">
                <div class="flex justify-between items-center">
                    <div class="text-xl">Font Preview: {{ font ? font.fontData.meta.name : '' }}</div>
                    <div class="form-control justify-center">
                        <label class="label">
                            <span class="label-text text-white pr-2">Preview Zoom</span>

                            <input
                                class="range range-xs range-accent w-32"
                                type="range"
                                min="1"
                                max="5"
                                step="1"
                                v-model="scale"
                                @input="loadFont"
                            />
                        </label>
                    </div>
                </div>
                <div class="flex flex-row gap-4 justify-start">
                    <div class="form-control">
                        <label class="label">
                            <span class="label-text text-white pr-2">Font Height</span>
                            <input
                                type="number"
                                v-model="pixelHeight"
                                class="input input-bordered input-sm w-20"
                                min="1"
                                @input="loadFont"
                            />
                        </label>
                    </div>
                    <div class="form-control flex-grow">
                        <label class="label justify-start">
                            <span class="label-text text-white pr-2">Preview Text</span>
                            <input
                                v-model="textPreview"
                                class="input input-bordered input-sm flex-grow"
                                @input="loadFont"
                            />
                        </label>
                    </div>
                </div>
                <template v-if="isReady">
                    <SelectFontPreview
                        :font="font"
                        :scale="scale"
                        :text="textPreview"
                    />
                </template>
                <div
                    v-else
                    class="text-center p-4"
                >
                    <div class="loading loading-spinner text-primary"></div>
                </div>
                <div class="col-span-2 flex flex-row justify-between mt-4">
                    <Button
                        @click="cancel"
                        danger
                    >
                        Cancel
                    </Button>
                    <Button
                        @click="importFont"
                        :success="true"
                    >
                        Import
                    </Button>
                </div>
            </div>
        </div>
    </Teleport>
</template>

<style></style>
