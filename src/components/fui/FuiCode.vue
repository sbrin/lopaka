<script lang="ts" setup>
import {shallowRef, toRefs, watch} from 'vue';
import {useSession} from '../../core/session';
import {debounce} from '../../utils';
const session = useSession();
const {updates} = toRefs(session.virtualScreen.state);
const content = shallowRef('');
watch(
    updates,
    debounce(() => (content.value = session.generateCode()), 500)
);
</script>
<template>
    <div class="fui-code">
        <pre>{{ content }}</pre>
    </div>
</template>
<style lang="css"></style>
