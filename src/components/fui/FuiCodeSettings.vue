<script lang="ts" setup>
import {computed, ref, toRefs, watch} from 'vue';
import {useSession} from '../../core/session';
import {logEvent} from '../../utils';
import Icon from '/src/components/layout/Icon.vue';
import {TextLayer} from '/src/core/layers/text.layer';
import {gfxSources} from '/src/draw/fonts/fontTypes';
import {FontFormat} from '/src/draw/fonts/font';

const props = defineProps<{
    updates: number;
}>();

const session = useSession();
const {platform, layers, customFonts} = toRefs(session.state);
const templates = computed(() => platform.value && session.platforms[platform.value].getTemplates());
const settings = computed(() => template.value && session.platforms[platform.value].getTemplateSettings());
const fontsList = computed(() => {
    const uniqueFonts = new Set<{name: string; title?: string; file: Promise<string>}>();
    const fonts = [...gfxSources, ...customFonts.value.filter((f) => f.format === FontFormat.FORMAT_GFX)];
    layers.value
        .filter((layer) => layer.getType() === 'string')
        .forEach((layer) => {
            const font = (layer as TextLayer).font;
            const gfxFontSource = fonts.find((f) => f.name === font.name);
            if (gfxFontSource && font.name !== 'adafruit') {
                uniqueFonts.add(gfxFontSource);
            }
        });
    return props.updates ? Array.from(uniqueFonts) : [];
});

const template = ref(
    localStorage.getItem(`lopaka_${platform.value}_code_template`) ?? session.platforms[platform.value].getTemplate()
);

session.platforms[platform.value].setTemplate(template.value);
const savedCodeSettings = JSON.parse(localStorage.getItem(`lopaka_${platform.value}_code_settings`)) ?? {};
for (let key in session.platforms[platform.value].getTemplateSettings()) {
    session.platforms[platform.value].getTemplateSettings()[key] = savedCodeSettings[key];
}

watch(template, (val) => {
    if (val) {
        session.platforms[platform.value].setTemplate(val);
        session.virtualScreen.redraw();
        localStorage.setItem(`lopaka_${platform.value}_code_template`, val);
    }
});

watch(platform, (val) => {
    if (val) {
        template.value = session.platforms[platform.value].getTemplate();
    }
});

function setSetting(event: Event, name: any) {
    const target = event.target as HTMLInputElement;
    session.platforms[platform.value].getTemplateSettings()[name] = target.checked;
    session.virtualScreen.redraw();

    localStorage.setItem(`lopaka_${platform.value}_code_settings`, JSON.stringify(settings.value));

    logEvent('code_setting', name);
}

function changeTemplate() {
    logEvent('code_template', template.value);
}

async function getFile(url: string, name: string) {
    try {
        const response = await fetch(url);
        const blob = await response.blob();
        const downloadUrl = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = `${name}.h`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(downloadUrl);
    } catch (error) {
        console.error('Error downloading file:', error);
    }
}

function downloadFont(font) {
    if (typeof font.file === 'function') {
        font.file().then((f) => {
            const blob = new Blob([f], {type: 'text/plain'});
            const url = URL.createObjectURL(blob);
            getFile(url, font.name);
        });
    } else {
        getFile(font.file, font.title);
    }
}

const LABELS = {
    wrap: 'Wrapper function',
    progmem: 'Declare as PROGMEM',
    include_fonts: 'Include fonts',
    comments: 'Layer titles',
};
</script>
<template>
    <div class="mt-8">
        <div
            class="text-lg"
            v-if="Object.keys(templates).length > 1 || Object.keys(settings).length"
        >
            Code settings
        </div>
        <div class="mb-2">
            <div
                class="fui-select label"
                v-if="Object.keys(templates).length > 1"
            >
                <label class="label">
                    <div class="text-sm">Style</div>
                    <select
                        class="select select-sm select-bordered ml-2"
                        v-model="template"
                        @change="changeTemplate"
                    >
                        <option
                            v-for="(item, idx) in Object.keys(templates)"
                            :key="idx"
                            :value="item"
                        >
                            {{ templates[item].name }}
                        </option>
                    </select>
                </label>
            </div>
            <div
                v-for="(value, key) in settings"
                class="form-control"
            >
                <label class="label cursor-pointer justify-start">
                    <input
                        class="checkbox checkbox-sm checkbox-primary"
                        type="checkbox"
                        :checked="value"
                        @change="setSetting($event, key)"
                    />
                    <span class="label-text ml-2">{{ LABELS[key] ?? key }}</span>
                </label>
            </div>
        </div>
        <template v-if="fontsList.length">
            <div class="text-lg mb-1">Fonts</div>
            <div class="flex flex-col gap-2">
                <div
                    class="flex flex-row gap-1"
                    v-for="font in fontsList"
                    :key="font.name"
                >
                    <Icon
                        type="clip"
                        sm
                        class="text-gray-400"
                    />
                    <div
                        class="text-sm link text-gray-400 truncate"
                        @click="downloadFont(font)"
                    >
                        {{ font.title ?? font.name }}.h
                    </div>
                </div>
            </div>
        </template>
    </div>
</template>
