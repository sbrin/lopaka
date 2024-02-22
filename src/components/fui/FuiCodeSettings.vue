<script lang="ts" setup>
import {computed, ref, toRefs, watch} from 'vue';
import {useSession} from '../../core/session';
const session = useSession();
const {platform} = toRefs(session.state);
const templates = computed(() => platform.value && session.platforms[platform.value].getTemplates());
const settings = computed(() => platform.value && Object.keys(session.platforms[platform.value].getTemplates()));
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
</script>
<template>
    <div class="code-settings">
        <div class="title">Settings:</div>
        <div class="fui-select">
            <label for="template" class="fui-select__label">Code style:</label>
            <select id="template" class="fui-select__select fui-form-input" v-model="template">
                <option v-for="(item, idx) in Object.keys(templates)" :key="idx" :value="item">{{ templates[item].name }}</option>
            </select>
        </div>
        <div class="fui-select">
            <label for="template" class="fui-select__label">PROGMEM</label>
            <!-- <input
                :disabled="session.state.isPublic"
                class="fui-form-input"
                type="checkbox"
                :checked="param.getValue()"
                @change="onChange($event, param)"
                :readonly="!param.setValue"
            /> -->
        </div>
    </div>
</template>
<style lang="css" scoped>
.code-settings {
    padding-left: 16px;
}
</style>
