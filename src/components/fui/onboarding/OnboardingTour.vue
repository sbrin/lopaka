<script
    lang="ts"
    setup
>
import { ref, computed } from 'vue';
import Icon from '/src/components/layout/Icon.vue';
import Button from '/src/components/layout/Button.vue';

const props = defineProps<{
    onComplete: () => void;
    onSkip: () => void;
}>();

const currentStep = ref(0);

const steps = [
    {
        title: 'Welcome to Lopaka!',
        description: 'Lopaka is a visual editor for creating embedded graphics. Let\'s take a quick tour.',
        icon: 'select' as const,
        highlight: null,
    },
    {
        title: 'Tools Bar',
        description: 'Use these tools to draw shapes, add text, and create UI elements for your embedded display.',
        icon: 'paint' as const,
        highlight: 'tools',
    },
    {
        title: 'Canvas',
        description: 'This is your design canvas. Click and drag to create shapes, or select tools to start drawing.',
        icon: 'rect' as const,
        highlight: 'canvas',
    },
    {
        title: 'Layers Panel',
        description: 'Manage your design elements here. Reorder, rename, lock, or hide layers.',
        icon: 'layers' as const,
        highlight: 'layers',
    },
    {
        title: 'Generated Code',
        description: 'Lopaka generates C/C++ code in real-time. Copy it and paste into your Arduino or ESP32 project!',
        icon: 'clipboard' as const,
        highlight: 'code',
    },
];

const current = computed(() => steps[currentStep.value]);
const progress = computed(() => ((currentStep.value + 1) / steps.length) * 100);

function next() {
    if (currentStep.value < steps.length - 1) {
        currentStep.value++;
    } else {
        complete();
    }
}

function prev() {
    if (currentStep.value > 0) {
        currentStep.value--;
    }
}

function complete() {
    localStorage.setItem('lopaka_onboarding_seen', 'true');
    props.onComplete();
}

function skip() {
    localStorage.setItem('lopaka_onboarding_seen', 'true');
    props.onSkip();
}
</script>

<template>
    <div class="onboarding-overlay">
        <div class="onboarding-card">
            <div class="onboarding-header">
                <div class="onboarding-icon">
                    <Icon :type="current.icon" lg />
                </div>
                <button
                    class="onboarding-close"
                    @click="skip"
                    title="Skip tutorial"
                >
                    <Icon type="close" sm />
                </button>
            </div>

            <div class="onboarding-progress">
                <div
                    class="onboarding-progress-bar"
                    :style="{ width: progress + '%' }"
                ></div>
            </div>

            <h3 class="onboarding-title">{{ current.title }}</h3>
            <p class="onboarding-description">{{ current.description }}</p>

            <div class="onboarding-footer">
                <span class="onboarding-step-counter">
                    {{ currentStep + 1 }} / {{ steps.length }}
                </span>
                <div class="onboarding-actions">
                    <Button
                        v-if="currentStep > 0"
                        @click="prev"
                        secondary
                    >
                        Back
                    </Button>
                    <Button
                        @click="skip"
                        secondary
                    >
                        Skip
                    </Button>
                    <Button
                        @click="next"
                        primary
                        filled
                    >
                        {{ currentStep === steps.length - 1 ? 'Get Started' : 'Next' }}
                    </Button>
                </div>
            </div>
        </div>
    </div>
</template>

<style lang="css" scoped>
.onboarding-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.6);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    backdrop-filter: blur(2px);
}

.onboarding-card {
    background: var(--secondary-color, #1a1a2e);
    border: 1px solid var(--primary-color, #7c3aed);
    border-radius: 12px;
    padding: 24px;
    max-width: 420px;
    width: 90%;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
}

.onboarding-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 16px;
}

.onboarding-icon {
    color: var(--primary-color, #7c3aed);
}

.onboarding-close {
    background: none;
    border: none;
    color: var(--text-muted, #6b7280);
    cursor: pointer;
    padding: 4px;
    border-radius: 4px;
    transition: color 0.15s;
}

.onboarding-close:hover {
    color: var(--text-color, #e5e7eb);
}

.onboarding-progress {
    height: 4px;
    background: var(--border-color, #374151);
    border-radius: 2px;
    margin-bottom: 16px;
    overflow: hidden;
}

.onboarding-progress-bar {
    height: 100%;
    background: var(--primary-color, #7c3aed);
    border-radius: 2px;
    transition: width 0.3s ease;
}

.onboarding-title {
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--text-color, #e5e7eb);
    margin: 0 0 8px;
}

.onboarding-description {
    font-size: 0.95rem;
    color: var(--text-muted, #9ca3af);
    line-height: 1.5;
    margin: 0 0 20px;
}

.onboarding-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.onboarding-step-counter {
    font-size: 0.8rem;
    color: var(--text-muted, #6b7280);
}

.onboarding-actions {
    display: flex;
    gap: 8px;
}
</style>
