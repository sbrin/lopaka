<script lang="ts" setup>
import {computed, ref, toRefs, watch} from 'vue';
import {useSession} from '../../core/session';
const session = useSession();
const {platform} = toRefs(session.state);
const templates = computed(() => platform.value && Object.keys(session.platforms[platform.value].getTemplates()));
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
        <h1>Settings:</h1>
        <div class="fui-select">
            <label for="template" class="fui-select__label">Code style:</label>
            <select id="template" class="fui-select__select fui-form-input" v-model="template">
                <option v-for="(item, idx) in templates" :key="idx" :value="item">{{ item }}</option>
            </select>
        </div>
    </div>
</template>
<style lang="css" scoped>
.code-settings {
    position: absolute;
    bottom: 350px;
    margin-left: 16px;
}
</style>
