<script setup lang="ts">
import {computed, defineProps, ref, toRefs} from 'vue';
import {logEvent} from '/src/utils';
import SelectFontWizard from './SelectFontWizard.vue';

const props = defineProps<{
    fonts: TPlatformFont[];
    fontsUsed: string[];
    disabled: boolean;
    fontValue: string;
    project_id: number;
}>();

const fontsList = computed(() => {
    return [...props.fonts];
});

const fontsMenu = ref(null);
const fontsBtn = ref(null);
const isLoading = ref(false);
const isFontWarningVisible = ref(false);
const isWizardVisible = ref(false);
const fontFile = ref();

const emit = defineEmits(['change']);

function onClick(font: TPlatformFont) {
    fontsBtn.value.blur();
    logEvent('select_font', font.name);
    emit('change', {
        target: {value: font.name},
    });
}

function hideFontsMenu() {
    fontsMenu.value.classList.add('hidden');
}
function showFontsMenu() {
    fontsMenu.value.classList.remove('hidden');
}

async function uploadFont(fontFile) {
    // TODO: add a local fonts support
    // const asset = await uploadAsset(fontFile, props.project_id, 'font');
    // addCustomFont(asset);
    isLoading.value = false;
    closeWizard();
}

function closeWizard() {
    isWizardVisible.value = false;
    isLoading.value = false;
}
</script>

<template>
    <SelectFontWizard
        v-if="isWizardVisible"
        :font_src="fontFile"
        @cancel="closeWizard"
        @import="uploadFont"
    />
    <div class="toast toast-top toast-center z-50">
        <div
            class="alert alert-warning"
            v-if="isFontWarningVisible"
        >
            <span>Cannot delete a font that is being used in the current project</span>
        </div>
    </div>
    <button
        ref="fontsBtn"
        :disabled="disabled"
        class="select select-sm select-bordered relative"
        :class="{'cursor-not-allowed': disabled}"
        @click.self="showFontsMenu"
        @blur="hideFontsMenu"
    >
        <div class="truncate pointer-events-none w-[128px] text-left flex">
            {{ fontsList.find((font) => font.name === fontValue)?.title }}
        </div>
        <div class="overflow-hidden w-48 right-[100%] -top-2 absolute z-10 rounded-box">
            <ul
                ref="fontsMenu"
                class="menu menu-xs max-h-[75vh] overflow-scroll box-content bg-secondary block hidden"
            >
                <li
                    v-for="font in fonts"
                    :key="font.name"
                >
                    <a
                        :class="{active: fontValue === font.name}"
                        @click="onClick(font)"
                    >
                        {{ font.title }}
                    </a>
                </li>
            </ul>
        </div>
    </button>
</template>
<style lang="css" scoped>
.custom-font-item:hover .custom-font-icon {
    display: inline;
}

.custom-font-item.active .custom-font-icon {
    display: none;
}

.custom-font-icon {
    display: none;
}

.highlight-enter-active {
    animation: highlight 1s;
}

@keyframes highlight {
    from {
        background-color: rgba(255, 255, 255, 0.5);
    }
    to {
        background-color: rgba(255, 255, 255, 0);
    }
}
</style>
