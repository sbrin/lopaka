<script lang="ts" setup>
import {ref, watch} from 'vue';
import {useSession} from '../../core/session';

const session = useSession();
const platform = ref(session.state.platform);

watch(platform, () => {
    session.setPlatform(platform.value);
});
</script>
<template>
    <div class="fui-select">
        <label for="library" class="fui-select__label">Library:</label>
        <select id="library" class="fui-select__select input-select" v-model="platform">
            <option v-for="(p, idx) in session.platforms" :key="idx" :value="idx">
                {{ p.getName() }}
            </option>
        </select>
    </div>
</template>
<style lang="css"></style>
