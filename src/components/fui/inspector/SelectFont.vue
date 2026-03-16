<script
    setup
    lang="ts"
>
import { computed, ref, toRefs } from 'vue';
import { logEvent } from '/src/utils';
import { addCustomFont, useSession } from '/src/core/session';
import Icon from '/src/components/layout/Icon.vue';
import bdf2gfx from '/src/draw/fonts/bdf2gfx';
import SelectFontWizard from './SelectFontWizard.vue';

const props = defineProps<{
    fonts: TPlatformFont[];
    fontsUsed: string[];
    disabled: boolean;
    fontValue: string;
    project_id: number;
}>();

const session = useSession();
const { state } = session;
const { platform, customFonts } = toRefs(state);

const fontTypes = computed(() => {
    if (!platform.value) return null;
    switch (platform.value) {
        case 'flipper':
        // TODO: add support for TTF fonts upload
        case 'esphome':
        case 'micropython':
            return null;
        case 'u8g2':
            return '.bdf';
        default:
            return '.h, .bdf, .ttf, .otf, .woff';
    }
});

const fontsList = computed(() => {
    return [...props.fonts, ...customFonts.value];
});

const fontsMenu = ref(null);
const fontsBtn = ref(null);
const fileLoadedCounter = ref(0);
const isLoading = ref(false);
const isFontWarningVisible = ref(false);
const isWizardVisible = ref(false);
const fontFile = ref();

const emit = defineEmits(['change']);

function onClick(font: TPlatformFont) {
    fontsBtn.value.blur();
    logEvent('select_font', font.name);
    emit('change', {
        target: { value: font.name, title: font.title },
    });
}

function hideFontsMenu() {
    fontsMenu.value.classList.add('hidden');
}
function showFontsMenu() {
    fontsMenu.value.classList.remove('hidden');
}

async function onFileChange(e: Event) {
    logEvent('import_font');
    isLoading.value = true;
    fileLoadedCounter.value += 1;

    const files = (e.target as HTMLInputElement).files;
    if (!files || !files.length) return;
    const file = files[0];
    if (!file.name) {
        return;
    }

    showFontsMenu();

    const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    const isU8G2Platform = platform.value === 'u8g2';

    // BDF fonts for adafruit-like platforms
    if (!isU8G2Platform && fileExtension === '.bdf') {
        fontFile.value = await bdf2gfx(file);
        await uploadFont(fontFile.value);
        return;
    }

    // TrueType fonts for adafruit-like platforms
    // Run wizard
    if (!isU8G2Platform && fileExtension !== '.h') {
        fontFile.value = file;
        isWizardVisible.value = true;
        return;
    }

    // TODO: convert GFX to BDF
    if (isU8G2Platform && fileExtension === '.h') {
        // const fontPackGFX = new GFXFont(file, file.name, null);
        // await fontPackGFX.fontReady;
        // console.log(fontPackGFX.fontData);
        // const bdfFont = encodeBDF(fontPackGFX.fontData);
        // console.log(bdfFont);

        // const bdfFontFile = new File([bdfFont], fontPackGFX.name + '.h', {type: 'text/plain'});
        // console.log(bdfFontFile);
        // await uploadFont(bdfFontFile);
        return;
    }

    // No conversion needed:
    // - GFX fonts for adafruit-like platforms
    // - BDF fonts for u8g2
    fontFile.value = file;
    await uploadFont(fontFile.value);
}

async function uploadFont(fontFile) {
    // TODO: add a local fonts support
    // addCustomFont(asset);
    isLoading.value = false;
    closeWizard();
}

function deleteFont(fontToDelete) {
    customFonts.value = customFonts.value.filter((font) => font.file !== fontToDelete.file);
    // TODO: add a local fonts support
}

function showToast() {
    isFontWarningVisible.value = true;
    setTimeout(() => {
        isFontWarningVisible.value = false;
    }, 3000);
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
        :class="{ 'cursor-not-allowed': disabled }"
        @click.self="showFontsMenu"
        @blur="hideFontsMenu"
    >
        <div class="truncate pointer-events-none w-[128px] text-left flex">
            {{fontsList.find((font) => font.name === fontValue)?.title}}
        </div>
        <div class="overflow-hidden w-48 right-[100%] -top-2 absolute z-20 rounded-box">
            <ul
                ref="fontsMenu"
                class="menu menu-xs max-h-[75vh] overflow-x-hidden overflow-y-auto box-content bg-secondary block hidden"
            >
                <!-- TODO: add support for local fonts
                  <template v-if="fontTypes">
                    <li>
                        <label class="relative">
                            Import {{ platform === 'u8g2' ? 'BDF' : '' }} font...
                            <div
                                v-if="isLoading"
                                class="loading loading-xs loading-spinner text-primary"
                            ></div>
                            <input
                                type="file"
                                style="position: fixed; top: -1000%"
                                :accept="fontTypes"
                                @change="onFileChange"
                                ref="fileInput"
                                :key="fileLoadedCounter"
                                :disabled="isLoading"
                            />
                        </label>
                    </li>
                    <div class="divider h-1 py-0 my-1"></div>
                </template>
<template v-if="customFonts.length">
                    <TransitionGroup name="highlight">
                        <li
                            v-for="font in customFonts"
                            :key="font.name"
                        >
                            <a
                                class="flex justify-between custom-font-item max-w-full"
                                :class="{'bg-neutral text-primary': fontValue === font.name}"
                                @click="onClick(font)"
                            >
                                <div class="truncate">{{ font.title }}</div>
                                <div
                                    v-if="!fontsUsed.includes(font.name)"
                                    class="px-1"
                                    @click.prevent.stop="deleteFont(font)"
                                >
                                    <Icon
                                        type="trash"
                                        class="-mr-1 custom-font-icon"
                                        danger
                                        title="Delete font"
                                        xs
                                    />
                                </div>
                                <div
                                    v-else
                                    class="px-1"
                                    @click.prevent.stop="showToast"
                                >
                                    <Icon
                                        type="trash"
                                        class="-mr-1 custom-font-icon text-neutral"
                                        xs
                                    />
                                </div>
                            </a>
                        </li>
                    </TransitionGroup>
                    <div class="divider h-1 py-0 my-1"></div>
                </template> -->
                <li
                    v-for="font in fonts"
                    :key="font.name"
                >
                    <a
                        :class="{ 'bg-neutral text-primary': fontValue === font.name }"
                        @click="onClick(font)"
                    >
                        {{ font.title }}
                    </a>
                </li>
            </ul>
        </div>
    </button>
</template>
<style
    lang="css"
    scoped
>
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
