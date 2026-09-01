<script lang="ts" setup>
import {computed, toRefs} from 'vue';
import {useSession} from '../../core/session';

const session = useSession();
const {preparePlatform} = session;
const {platform, immidiateUpdates} = toRefs(session.state);

const color_bg = computed({
    get: () => {
        // Platform features are plain objects, so also depend on the session
        // mutation counter for WebMCP background changes.
        immidiateUpdates.value;
        return session.getPlatformFeatures(platform.value)?.screenBgColor ?? '#000000';
    },
    set: (value: string) => {
        const features = session.getPlatformFeatures(platform.value);
        if (!features || features.screenBgColor === value) return;
        features.screenBgColor = value;
        void preparePlatform(platform.value).then(() => {
            // Invalidate dependent UI only after the platform reload has
            // finished, so autosave captures the final layer state.
            session.state.immidiateUpdates++;
        });
        localStorage.setItem(`lopaka_${platform.value}_color_bg`, value);
    },
});
</script>
<template>
    <div class="fui-select fui-platforms">
        <label class="flex items-center gap-2">
            Background:
            <input
                class="text-primary select select-bordered select-sm w-16 pl-0 pr-1"
                type="color"
                v-model="color_bg"
                list="presetColors"
            />
        </label>
    </div>
</template>
<style lang="css"></style>
