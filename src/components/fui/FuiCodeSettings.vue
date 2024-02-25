<script lang="ts" setup>
import {computed, ref, toRefs, watch} from 'vue';
import {useSession} from '../../core/session';
import { FlipperPlatform } from "../../platforms/flipper";
import { U8g2Platform } from "../../platforms/u8g2";
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
}

const LABELS = {
    wrap: 'Wrapper function',
    progmem: 'Declare as PROGMEM',
}
</script>
<template>
    <div class="code-settings" v-if="platform === U8g2Platform.id">
        <div class="title">Settings:</div>
        <div class="fui-select">
            <label for="template" class="fui-form-label">Code style:</label>
            <select id="template" class="fui-select__select fui-form-input" v-model="template">
                <option v-for="(item, idx) in Object.keys(templates)" :key="idx" :value="item">
                    {{ templates[item].name }}
                </option>
            </select>
        </div>
        <div v-for="(value, key) in settings" class="code-settings-row">
            <div class="fui-form-checkbox">
                <input
                    type="checkbox"
                    :id="'settings_' + key"
                    class="fui-form-input"
                    :checked="value"
                    @change="setSetting($event, key)"
                />
            </div>
            <label :for="'settings_' + key" class="fui-form-label">{{ LABELS[key] ?? key }}</label>
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
