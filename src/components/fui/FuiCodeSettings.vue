<script lang="ts" setup>
import {computed, ref, toRefs, watch} from 'vue';
import {useSession} from '../../core/session';
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
</script>
<template>
    <div class="code-settings">
        <div class="title">Settings:</div>
        <div class="fui-select">
            <label for="template" class="fui-select__label">Code style:</label>
            <select id="template" class="fui-select__select fui-form-input" v-model="template">
                <option v-for="(item, idx) in Object.keys(templates)" :key="idx" :value="item">
                    {{ templates[item].name }}
                </option>
            </select>
        </div>
        <div class="" v-for="(value, name) in settings">
            <label :for="'settings_' + name" class="fui-form-label">{{ name }}</label>
            <input
                type="checkbox"
                :id="'settings_' + name"
                class="fui-form-input"
                :checked="value"
                @change="setSetting($event, name)"
            />
        </div>
    </div>
</template>
<style lang="css" scoped>
.code-settings {
    padding-left: 16px;
}
</style>
