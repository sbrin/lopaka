<script
    lang="ts"
    setup
>
import { ref } from 'vue';
import { useSession } from '/src/core/session';
import { generateShareUrl } from '/src/utils/share';
import Icon from '/src/components/layout/Icon.vue';
import Button from '/src/components/layout/Button.vue';

const props = defineProps<{
    onClose: () => void;
}>();

const session = useSession();
const shareUrl = ref('');
const copied = ref(false);

function generateUrl() {
    const layers = session.layersManager.layers.map((l) => l.state);
    const { platform, display } = session.state;
    shareUrl.value = generateShareUrl(layers, platform, display, session.state.screenTitle || 'Lopaka Design');
}

function copyUrl() {
    if (!shareUrl.value) {
        generateUrl();
    }
    navigator.clipboard.writeText(shareUrl.value).then(() => {
        copied.value = true;
        setTimeout(() => {
            copied.value = false;
        }, 2000);
    });
}

// Generate URL on mount
generateUrl();
</script>

<template>
    <div class="share-dialog-overlay" @click.self="onClose">
        <div class="share-dialog">
            <div class="share-dialog-header">
                <h3>Share Design</h3>
                <button
                    class="share-dialog-close"
                    @click="onClose"
                >
                    <Icon type="close" sm />
                </button>
            </div>

            <div class="share-dialog-body">
                <p class="share-description">
                    Anyone with this link can view your design. No login required.
                </p>

                <div class="share-url-container">
                    <input
                        v-if="shareUrl"
                        class="share-url-input"
                        type="text"
                        readonly
                        :value="shareUrl"
                        @click="$event.target.select()"
                    />
                    <div v-else class="share-url-placeholder">
                        Generating share link...
                    </div>
                </div>

                <div class="share-actions">
                    <Button
                        @click="copyUrl"
                        :primary="!copied"
                        :success="copied"
                        filled
                    >
                        <Icon type="clipboard" />
                        {{ copied ? 'Copied!' : 'Copy Link' }}
                    </Button>
                </div>

                <div class="share-badge-preview">
                    <p class="share-badge-note">
                        Shared designs include a "Made with Lopaka" badge.
                    </p>
                </div>
            </div>
        </div>
    </div>
</template>

<style lang="css" scoped>
.share-dialog-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.6);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 999;
    backdrop-filter: blur(2px);
}

.share-dialog {
    background: var(--secondary-color, #1a1a2e);
    border: 1px solid var(--border-color, #374151);
    border-radius: 12px;
    padding: 24px;
    max-width: 480px;
    width: 90%;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
}

.share-dialog-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 16px;
}

.share-dialog-header h3 {
    font-size: 1.125rem;
    font-weight: 600;
    color: var(--text-color, #e5e7eb);
    margin: 0;
}

.share-dialog-close {
    background: none;
    border: none;
    color: var(--text-muted, #6b7280);
    cursor: pointer;
    padding: 4px;
    border-radius: 4px;
    transition: color 0.15s;
}

.share-dialog-close:hover {
    color: var(--text-color, #e5e7eb);
}

.share-description {
    font-size: 0.875rem;
    color: var(--text-muted, #9ca3af);
    margin: 0 0 16px;
}

.share-url-container {
    margin-bottom: 16px;
}

.share-url-input {
    width: 100%;
    padding: 8px 12px;
    background: var(--bg-color, #111827);
    border: 1px solid var(--border-color, #374151);
    border-radius: 6px;
    color: var(--text-color, #e5e7eb);
    font-size: 0.8rem;
    font-family: monospace;
    cursor: pointer;
}

.share-url-input:focus {
    outline: none;
    border-color: var(--primary-color, #7c3aed);
}

.share-url-placeholder {
    padding: 8px 12px;
    color: var(--text-muted, #6b7280);
    font-size: 0.875rem;
}

.share-actions {
    display: flex;
    justify-content: center;
    margin-bottom: 16px;
}

.share-badge-preview {
    padding-top: 12px;
    border-top: 1px solid var(--border-color, #374151);
}

.share-badge-note {
    font-size: 0.75rem;
    color: var(--text-muted, #6b7280);
    margin: 0;
    text-align: center;
}
</style>
