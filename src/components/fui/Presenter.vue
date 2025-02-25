<script lang="ts" setup>
import {ref, computed, watch, onMounted, onUnmounted, toRefs} from 'vue';
import {useSession} from '/src/core/session';
import {ProjectScreen} from '/src/types';

const props = defineProps<{screens: ProjectScreen[]}>();
const emit = defineEmits(['close']);

const currentIndex = ref(0);
const galleryContainer = ref<HTMLElement | null>(null);
const isFullScreen = ref(false);
const controlsVisible = ref(true);
let controlsTimer: number | null = null;

const session = useSession();
const {state} = session;
const {platform} = toRefs(state);

const backgroundColor = session.getPlatformFeatures(platform.value).screenBgColor;

const currentScreen = computed(() => {
    return props.screens && props.screens.length > 0 ? props.screens[currentIndex.value] : null;
});

function prevImage() {
    if (!props.screens || props.screens.length === 0) return;
    currentIndex.value = (currentIndex.value - 1 + props.screens.length) % props.screens.length;
}

function nextImage() {
    if (!props.screens || props.screens.length === 0) return;
    currentIndex.value = (currentIndex.value + 1) % props.screens.length;
}

const selectImage = (index: number) => {
    currentIndex.value = index;
};

async function toggleFullScreen() {
    if (!galleryContainer.value) return;
    if (!document.fullscreenElement) {
        try {
            await galleryContainer.value.requestFullscreen();
            isFullScreen.value = true;
        } catch (err) {
            console.error('Error enabling fullscreen:', err);
        }
    } else {
        try {
            await document.exitFullscreen();
            isFullScreen.value = false;
        } catch (err) {
            console.error('Error exiting fullscreen:', err);
        }
    }
}

function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
        if (isFullScreen.value) {
            isFullScreen.value = false;
        } else {
            emit('close');
        }
    } else if (event.key === 'ArrowLeft') {
        prevImage();
    } else if (event.key === 'ArrowRight') {
        nextImage();
    } else if (event.key === 'f') {
        toggleFullScreen();
    }
}

function handleFullscreenChange() {
    if (!document.fullscreenElement) {
        isFullScreen.value = false;
    }
}

function resetControlsTimer() {
    controlsVisible.value = true;
    if (controlsTimer !== null) {
        clearTimeout(controlsTimer);
    }
    controlsTimer = window.setTimeout(() => {
        controlsVisible.value = false;
    }, 2000);
}

onMounted(() => {
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('keydown', handleKeydown);
    document.addEventListener('mousemove', resetControlsTimer);
    resetControlsTimer();
});

onUnmounted(() => {
    document.removeEventListener('fullscreenchange', handleFullscreenChange);
    document.removeEventListener('keydown', handleKeydown);
    document.removeEventListener('mousemove', resetControlsTimer);
});

watch(
    () => props.screens,
    (newScreens) => {
        if (newScreens.length === 0) {
            currentIndex.value = 0;
        } else if (currentIndex.value >= newScreens.length) {
            currentIndex.value = 0;
        }
    }
);
</script>
<template>
    <dialog class="modal modal-open">
        <div class="modal-box relative max-w-full h-full border border-base-300">
            <button
                class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
                @click="$emit('close')"
            >
                ✕
            </button>
            <div
                ref="galleryContainer"
                class="flex flex-col items-center justify-center p-4 h-full"
            >
                <div class="relative w-full min-h-[600px] h-full flex flex-col items-center justify-center">
                    <img
                        v-if="currentScreen"
                        :src="currentScreen.img_preview"
                        alt="Screen image"
                        class="border border-base-300 pixelated h-2/3"
                        :style="{
                            backgroundColor: backgroundColor,
                        }"
                    />
                    <div
                        v-else
                        class="p-5 text-center"
                    >
                        No image available
                    </div>
                    <p class="pt-2">{{ currentScreen.title }}</p>
                </div>
                <div
                    class="mt-2 flex gap-2 justify-center"
                    :class="['transition-opacity duration-300', controlsVisible ? 'opacity-100' : 'opacity-0']"
                >
                    <div
                        v-for="(screen, index) in props.screens"
                        :key="index"
                        @click="selectImage(index)"
                        class="cursor-pointer"
                    >
                        <img
                            :src="screen.img_preview"
                            alt="thumbnail"
                            class="w-16 h-16 object-cover border pixelated"
                            :class="index === currentIndex ? 'border-4 border-primary' : 'p-1 border-base-300'"
                            :style="{
                                backgroundColor: backgroundColor,
                            }"
                        />
                    </div>
                </div>
                <div
                    :class="[
                        'mt-8 flex gap-4 transition-opacity duration-300',
                        controlsVisible ? 'opacity-100' : 'opacity-0',
                    ]"
                >
                    <button
                        @click="prevImage"
                        class="btn btn-primary btn-sm"
                    >
                        ←
                    </button>
                    <button
                        @click="toggleFullScreen"
                        class="btn btn-secondary btn-sm"
                    >
                        {{ isFullScreen ? 'Exit Fullscreen' : 'Fullscreen' }}
                    </button>
                    <button
                        @click="nextImage"
                        class="btn btn-primary btn-sm"
                    >
                        →
                    </button>
                </div>
            </div>
        </div>
    </dialog>
</template>
