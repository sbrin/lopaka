<script lang="ts" setup>
import {ref, toRefs, watch} from 'vue';
import {useSession} from '../../core/session';

const session = useSession();
const {preparePlatform} = session;

const color_bg = ref(session.platforms[session.state.platform].features.screenBgColor);

const emit = defineEmits<{
    'update:color_bg': [value: string];
}>();

watch(color_bg, (val, oldVal) => {
    if (val !== oldVal) {
        session.platforms[session.state.platform].features.screenBgColor = val;
        preparePlatform(session.state.platform);
        localStorage.setItem(`lopaka_${session.state.platform}_color_bg`, val);
    }
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
