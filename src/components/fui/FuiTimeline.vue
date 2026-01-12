<script lang="ts" setup>
import {computed, toRefs} from 'vue';
import {useSession} from '../../core/session';
import VueDraggable from 'vuedraggable';
import Icon from '/src/components/layout/Icon.vue';
import Button from '/src/components/layout/Button.vue';

const props = defineProps<{
    readonly?: boolean;
}>();

const session = useSession();
const {frames, currentFrameIndex, animationSettings, isPlaying} = toRefs(session.state);

const orderedFrames = computed({
    get: () => frames.value,
    set: (newFrames) => {
        session.state.frames = newFrames;
    },
});

function setActiveFrame(index: number) {
    if (isPlaying.value) {
        session.pauseAnimation();
    }
    session.setCurrentFrame(index);
}

function addFrame() {
    session.addFrame(true);
}

function addEmptyFrame() {
    session.addFrame(false);
}

function deleteFrame(index: number, event: Event) {
    event.stopPropagation();
    session.deleteFrame(index);
}

function duplicateFrame(index: number, event: Event) {
    event.stopPropagation();
    session.duplicateFrame(index);
}

function togglePlayback() {
    if (isPlaying.value) {
        session.pauseAnimation();
    } else {
        session.playAnimation();
    }
}

function stopPlayback() {
    session.stopAnimation();
}

function updateFps(event: Event) {
    const target = event.target as HTMLInputElement;
    session.setAnimationFps(parseInt(target.value) || 12);
}
</script>

<template>
    <div
        class="timeline-container"
        v-if="frames.length > 0"
    >
        <!-- Controls Bar -->
        <div class="timeline-controls">
            <div class="control-group">
                <Button
                    @click="addFrame"
                    title="Add new frame (copy current)"
                    class="btn-sm"
                >
                    <Icon
                        type="plus"
                        xs
                    />
                </Button>
                <Button
                    @click="addEmptyFrame"
                    title="Add empty frame"
                    class="btn-sm"
                >
                    <Icon
                        type="plus"
                        xs
                    />
                    <span class="text-xs">Empty</span>
                </Button>
            </div>

            <div class="control-group playback-controls">
                <Button
                    @click="stopPlayback"
                    title="Stop and go to first frame"
                    class="btn-sm"
                    :disabled="frames.length <= 1"
                >
                    <Icon
                        type="stop"
                        xs
                    />
                </Button>
                <Button
                    @click="togglePlayback"
                    :title="isPlaying ? 'Pause' : 'Play'"
                    class="btn-sm"
                    :disabled="frames.length <= 1"
                >
                    <Icon
                        :type="isPlaying ? 'pause' : 'play'"
                        xs
                    />
                </Button>
            </div>

            <div class="control-group">
                <label class="fps-control">
                    <span class="text-xs text-gray-400">FPS:</span>
                    <input
                        type="number"
                        :value="animationSettings.fps"
                        @change="updateFps"
                        min="1"
                        max="60"
                        class="input input-xs input-bordered w-14 text-center"
                    />
                </label>
            </div>

            <div class="control-group">
                <label
                    class="flex items-center gap-1 cursor-pointer"
                    title="Loop animation"
                >
                    <input
                        type="checkbox"
                        :checked="animationSettings.loop"
                        @change="session.toggleLoop()"
                        class="checkbox checkbox-xs checkbox-primary"
                    />
                    <span class="text-xs text-gray-400">Loop</span>
                </label>
                <label
                    class="flex items-center gap-1 cursor-pointer"
                    title="Ping-pong (play forward then backward)"
                >
                    <input
                        type="checkbox"
                        :checked="animationSettings.pingPong"
                        @change="session.togglePingPong()"
                        class="checkbox checkbox-xs checkbox-primary"
                    />
                    <span class="text-xs text-gray-400">Ping-Pong</span>
                </label>
            </div>

            <div class="control-group">
                <Button
                    @click="session.toggleOnionSkin()"
                    :title="animationSettings.onionSkin ? 'Disable Onion Skin' : 'Enable Onion Skin'"
                    class="btn-sm"
                    :class="{'text-primary': animationSettings.onionSkin}"
                >
                    <Icon
                        :type="animationSettings.onionSkin ? 'eye' : 'eye-slash'"
                        xs
                    />
                </Button>
            </div>

            <div class="control-group ml-auto">
                <span class="text-xs text-gray-500">Frame {{ currentFrameIndex + 1 }} / {{ frames.length }}</span>
            </div>
        </div>

        <!-- Frames Timeline -->
        <div class="timeline-frames">
            <VueDraggable
                class="frames-list"
                v-model="orderedFrames"
                item-key="id"
                :disabled="readonly || isPlaying"
            >
                <template #item="{element, index}">
                    <div
                        class="frame-item"
                        :class="{'frame-active': index === currentFrameIndex}"
                        @click="setActiveFrame(index)"
                    >
                        <div class="frame-preview">
                            <span class="frame-number">{{ index + 1 }}</span>
                        </div>
                        <div class="frame-title">{{ element.title }}</div>
                        <div
                            class="frame-actions"
                            v-if="!readonly && !isPlaying"
                        >
                            <!-- <button
                                class="btn btn-xs btn-ghost"
                                @click="duplicateFrame(index, $event)"
                                title="Duplicate frame"
                            >
                                <Icon
                                    type="clipboard"
                                    xs
                                />
                            </button> -->
                            <button
                                class="btn btn-xs btn-ghost"
                                @click="deleteFrame(index, $event)"
                                title="Delete frame"
                                :disabled="frames.length <= 1"
                            >
                                <Icon
                                    type="trash"
                                    xs
                                />
                            </button>
                        </div>
                    </div>
                </template>
            </VueDraggable>
        </div>
    </div>

    <!-- Initialize button for projects without frames -->
    <div
        v-else
        class="timeline-init"
    >
        <Button
            @click="session.initializeFrames()"
            class="btn-sm"
        >
            <Icon
                type="plus"
                xs
            />
            Enable Animation
        </Button>
    </div>
</template>

<style lang="css" scoped>
.timeline-container {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 8px;
    background: var(--fallback-b2, oklch(var(--b2)));
    border-radius: 8px;
    margin-top: 8px;
}

.timeline-controls {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 4px 8px;
    flex-wrap: wrap;
}

.control-group {
    display: flex;
    align-items: center;
    gap: 4px;
}

.playback-controls {
    border-left: 1px solid var(--fallback-b3, oklch(var(--b3)));
    border-right: 1px solid var(--fallback-b3, oklch(var(--b3)));
    padding: 0 12px;
}

.fps-control {
    display: flex;
    align-items: center;
    gap: 4px;
}

.timeline-frames {
    overflow-x: auto;
    padding: 4px;
}

.frames-list {
    display: flex;
    gap: 8px;
    min-height: 80px;
}

.frame-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    padding: 8px;
    min-width: 70px;
    background: var(--fallback-b3, oklch(var(--b3)));
    border: 2px solid transparent;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.15s ease;
}

.frame-item:hover {
    background: var(--fallback-b1, oklch(var(--b1)));
}

.frame-active {
    border-color: var(--fallback-p, oklch(var(--p)));
    background: var(--fallback-b1, oklch(var(--b1)));
}

.frame-preview {
    width: 50px;
    height: 40px;
    background: var(--fallback-b1, oklch(var(--b1)));
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
    font-weight: bold;
    color: var(--fallback-bc, oklch(var(--bc) / 0.5));
}

.frame-active .frame-preview {
    background: var(--fallback-p, oklch(var(--p) / 0.2));
    color: var(--fallback-p, oklch(var(--p)));
}

.frame-title {
    font-size: 10px;
    color: var(--fallback-bc, oklch(var(--bc) / 0.7));
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 60px;
}

.frame-number {
    font-size: 16px;
}

.frame-actions {
    display: none;
    gap: 2px;
}

.frame-item:hover .frame-actions {
    display: flex;
}

.timeline-init {
    display: flex;
    justify-content: center;
    padding: 8px;
    margin-top: 8px;
}

/* Drag styles */
.sortable-ghost {
    opacity: 0.5;
}

.sortable-chosen {
    border-color: var(--fallback-s, oklch(var(--s)));
}
</style>
