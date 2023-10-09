<script lang="ts" setup>
import {toRefs} from 'vue';
import {useSession} from '../../core/session';

const session = useSession();
const {platform} = toRefs(session.state);
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
