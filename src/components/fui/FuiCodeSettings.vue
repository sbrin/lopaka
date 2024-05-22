<script lang="ts" setup>
import {computed, ref, toRefs, watch} from 'vue';
import {useSession} from '../../core/session';
import {U8g2Platform} from '../../platforms/u8g2';
import {logEvent} from '../../utils';
import {Uint32RawPlatform} from '../../platforms/uint32-raw';
const session = useSession();
const {platform} = toRefs(session.state);
const templates = computed(() => platform.value && session.platforms[platform.value].getTemplates());
const settings = computed(() => template.value && session.platforms[platform.value].getTemplateSettings());
const template = ref(session.platforms[platform.value].getTemplate());
watch(template, (val) => {
    if (val) {
        session.platforms[platform.value].setTemplate(val);
        session.virtualScreen.redraw();
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
    logEvent('code_setting', name);
}

function changeTemplate() {
    logEvent('code_template', template.value);
}

const LABELS = {
    wrap: 'Wrapper function',
    progmem: 'Declare as PROGMEM'
};
</script>
<template>
    <div class="code-settings" v-if="platform !== Uint32RawPlatform.id">
        <div class="title" v-if="Object.keys(templates).length > 1 || Object.keys(settings).length">Code settings:</div>
        <div class="font-mono">
            <div class="fui-select label" v-if="Object.keys(templates).length > 1">
                <label for="template" class="label-text">Code style:</label>
                <select id="template" class="fui-select__select fui-form-input" v-model="template" @change="changeTemplate">
                    <option v-for="(item, idx) in Object.keys(templates)" :key="idx" :value="item">
                        {{ templates[item].name }}
                    </option>
                </select>
            </div>
            <div v-for="(value, key) in settings" class="form-control">
                <label class="label cursor-pointer justify-start">
                    <input class="checkbox checkbox-sm checkbox-primary"
                    type="checkbox"
                    :checked="value"
                    @change="setSetting($event, key)"
                    />
                    <span class="label-text ml-2">{{ LABELS[key] ?? key }}</span>
                </label>
            </div>
        </div>
    </div>
</template>
<style lang="css" scoped>
.code-settings {
}
.code-settings-row {
    padding: 8px 0 0 0;
    display: flex;
}
</style>
