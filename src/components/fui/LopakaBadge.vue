<script
    lang="ts"
    setup
>
defineProps<{
    compact?: boolean;
}>();
</script>

<template>
    <a
        class="lopaka-badge"
        :class="{ 'lopaka-badge--compact': compact }"
        href="https://lopaka.app"
        target="_blank"
        rel="noopener noreferrer"
        title="Made with Lopaka - Create embedded graphics"
    >
        <span class="lopaka-badge-text">Made with</span>
        <span class="lopaka-badge-logo">Lopaka</span>
    </a>
</template>

<style lang="css">
.lopaka-badge {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 4px 8px;
    background: rgba(0, 0, 0, 0.5);
    border-radius: 4px;
    text-decoration: none;
    font-size: 11px;
    font-family: system-ui, -apple-system, sans-serif;
    transition: background 0.15s;
}

.lopaka-badge:hover {
    background: rgba(0, 0, 0, 0.7);
}

.lopaka-badge-text {
    color: rgba(255, 255, 255, 0.7);
}

.lopaka-badge-logo {
    color: #7c3aed;
    font-weight: 600;
}

.lopaka-badge--compact {
    padding: 2px 6px;
    font-size: 9px;
}
</style>
