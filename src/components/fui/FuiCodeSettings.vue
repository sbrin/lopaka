<script
    lang="ts"
    setup
>
import { computed, ref, toRefs, watch } from 'vue';
import { useSession } from '../../core/session';
import { buildLvglImageExport, logEvent, toCppVariableName } from '../../utils';
import Icon from '/src/components/layout/Icon.vue';
import { PaintLayer } from '/src/core/layers/paint.layer';
import imageTemplate from '/src/platforms/templates/lvgl/image.pug';
import { TextLayer } from '/src/core/layers/text.layer';
import { bdfSources, gfxSources } from '/src/draw/fonts/fontTypes';
import { FontFormat } from '/src/draw/fonts/font';

const props = defineProps<{
    updates: number;
}>();

const session = useSession();

const { platform, customFonts } = toRefs(session.state);
const templates = computed(() => platform.value && session.platforms[platform.value].getTemplates());
const settings = computed(() => template.value && session.platforms[platform.value].getTemplateSettings());
const fontsList = computed(() => {
    const uniqueFonts = new Set<{ name: string; title?: string; file: Promise<string>; format?: FontFormat }>();
    const fonts: {
        name: string;
        file: any;
        format?: FontFormat;
    }[] = [
            ...gfxSources,
            ...bdfSources,
            ...customFonts.value.filter((f) => f.format === FontFormat.FORMAT_GFX || f.format === FontFormat.FORMAT_BDF),
        ];
    session.layersManager.layers
        // Collect fonts referenced by text and text area layers.
        .filter((layer) => layer.getType() === 'string' || layer.getType() === 'textarea')
        .forEach((layer) => {
            const font = (layer as TextLayer).font;
            const fontSource = fonts.find((f) => f.name === font.name);
            if (fontSource && font.name !== 'adafruit') {
                fontSource.format = font.format;
                uniqueFonts.add(fontSource);
            }
        });
    return props.updates ? Array.from(uniqueFonts) : [];
});

const imageList = computed(() => {
    return props.updates
        ? (session.layersManager.layers.filter((layer) => layer.getType() === 'paint') as PaintLayer[])
        : ([] as PaintLayer[]);
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
        // session.virtualScreen.redraw();
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
    session.platforms[platform.value].setTemplateSetting(name, target.checked);
    session.virtualScreen.redraw();
    session.state.immidiateUpdates++;

    localStorage.setItem(`lopaka_${platform.value}_code_settings`, JSON.stringify(settings.value));

    logEvent('code_setting', name);
}

function changeTemplate() {
    logEvent('code_template', template.value);
}

async function triggerDownload(url: string, filename: string) {
    try {
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    } catch (error) {
        console.error('Error downloading file:', error);
    }
}

async function getFontFile(url: string, font) {
    try {
        const response = await fetch(url);
        const blob = await response.blob();
        const downloadUrl = URL.createObjectURL(blob);
        const filename = `${font.title ?? font.name}${font.format === FontFormat.FORMAT_BDF ? '.bdf' : '.h'}`;
        triggerDownload(downloadUrl, filename);
    } catch (error) {
        console.error('Error downloading file:', error);
    }
}

function downloadFont(font) {
    if (typeof font.file === 'function') {
        font.file().then((f) => {
            const blob = new Blob([f], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            getFontFile(url, font);
        });
    } else {
        getFontFile(font.file, font);
    }
}

function downloadImage(image: PaintLayer) {
    // Normalize the image name for C identifiers.
    const name = toCppVariableName(image.name);
    // Decide whether to include alpha based on the layer color mode.
    const includeAlpha = image.colorMode === 'rgb' ? image.alphaChannel : false;
    // Build the LVGL export payload with the requested alpha handling.
    const exportData = buildLvglImageExport(
        image.data,
        session.getPlatformFeatures().screenBgColor,
        includeAlpha
    );
    const content = imageTemplate({
        imageName: name,
        imageData565: exportData.bytes.join(', '),
        imageWidth: image.data.width,
        imageHeight: image.data.height,
        imageDataSize: exportData.dataSize,
        imageColorFormat: exportData.colorFormat,
    });
    // Trigger the file download as a .c source file.
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    triggerDownload(url, `${name}.c`);
}

const LABELS = {
    wrap: 'Wrapper function',
    progmem: 'Declare as PROGMEM',
    include_fonts: 'Include fonts',
    include_images: 'Declare images',
    declare_vars: 'Declare variables',
    comments: 'Layer titles',
    clear_screen: 'Clear/Fill display',
};
</script>
<template>
    <div class="">
        <div class="">
            <div
                class="fui-select"
                v-if="Object.keys(templates).length > 1"
            >
                <label class="label label-xs">
                    <div class="text-sm">Syntax</div>
                    <select
                        class="select select-xs select-bordered ml-2"
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
                <label class="label label-xs cursor-pointer justify-start py-1">
                    <input
                        class="checkbox checkbox-xs checkbox-primary"
                        type="checkbox"
                        :name="key"
                        :checked="value"
                        @change="setSetting($event, key)"
                    />
                    <span class="label-text ml-2">{{ LABELS[key] ?? key }}</span>
                </label>
            </div>
        </div>
        <template v-if="session.getPlatformFeatures(platform).hasFonts && fontsList.length">
            <div class="text-md mb-1">Fonts</div>
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
                        {{ font.title ?? font.name }}{{ font.format === FontFormat.FORMAT_BDF ? '.bdf' : '.h' }}
                    </div>
                </div>
            </div>
        </template>
        <template v-if="session.getPlatformFeatures(platform).hasImages && imageList.length">
            <div class="text-md mb-1">Images</div>
            <div class="flex flex-col gap-2">
                <div
                    class="flex flex-row gap-1"
                    v-for="image in imageList"
                    :key="image.name"
                >
                    <Icon
                        type="clip"
                        sm
                        class="text-gray-400"
                    />
                    <div
                        class="text-sm link text-gray-400 truncate"
                        @click="downloadImage(image)"
                    >
                        {{ image.name + '.c' }}
                    </div>
                </div>
            </div>
        </template>
    </div>
</template>
