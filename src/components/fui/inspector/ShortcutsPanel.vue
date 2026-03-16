<template>
    <div>
        <div class="text-lg pb-2">Shortcuts</div>
        <div class="text-xs flex flex-col gap-1 text-gray-300">
            <p>
                <kbd class="kbd kbd-xs bg-base-300">SHIFT</kbd>
                +
                <kbd class="kbd kbd-xs bg-base-300">←</kbd>
                <kbd class="kbd kbd-xs bg-base-300">→</kbd>
                <kbd class="kbd kbd-xs bg-base-300">↑</kbd>
                <kbd class="kbd kbd-xs bg-base-300">↓</kbd>
                — move 10px
            </p>
            <p>
                <kbd class="kbd kbd-xs bg-base-300">CTRL</kbd>
                +
                <kbd class="kbd kbd-xs bg-base-300">↑</kbd>
                <kbd class="kbd kbd-xs bg-base-300">↓</kbd>
                — reorder layers
            </p>
            <p>
                <kbd class="kbd kbd-xs bg-base-300">CTRL</kbd>
                +
                <kbd class="kbd kbd-xs bg-base-300">C</kbd>
                /
                <kbd class="kbd kbd-xs bg-base-300">V</kbd>
                /
                <kbd class="kbd kbd-xs bg-base-300">X</kbd>
                — copy/paste/cut
            </p>
            <p>
                <kbd class="kbd kbd-xs bg-base-300">CTRL</kbd>
                +
                <kbd class="kbd kbd-xs bg-base-300">A</kbd>
                — select all
            </p>
            <p>
                <kbd class="kbd kbd-xs bg-base-300">CTRL</kbd>
                +
                <kbd class="kbd kbd-xs bg-base-300">Z</kbd>
                — undo
            </p>
            <p>
                <kbd class="kbd kbd-xs bg-base-300">CTRL</kbd>
                +
                <kbd class="kbd kbd-xs bg-base-300">SHIFT</kbd>
                +
                <kbd class="kbd kbd-xs bg-base-300">Z</kbd>
                — redo
            </p>
            <p>
                <kbd class="kbd kbd-xs bg-base-300">CTRL</kbd>
                +
                <kbd class="kbd kbd-xs bg-base-300">+</kbd>
                /
                <kbd class="kbd kbd-xs bg-base-300">-</kbd>
                — zoom in/out
            </p>
            <p>
                <kbd class="kbd kbd-xs bg-base-300">SHIFT</kbd>
                +
                <kbd class="kbd kbd-xs bg-base-300">CLICK</kbd>
                — multi-select
            </p>
            <p>
                <kbd class="kbd kbd-xs bg-base-300">ESC</kbd>
                — reset selection
            </p>
            <p>
                <kbd class="kbd kbd-xs bg-base-300">CTRL</kbd>
                +
                <kbd class="kbd kbd-xs bg-base-300">G</kbd>
                — group layers
            </p>
            <p>
                <kbd class="kbd kbd-xs bg-base-300">CTRL</kbd>
                +
                <kbd class="kbd kbd-xs bg-base-300">SHIFT</kbd>
                +
                <kbd class="kbd kbd-xs bg-base-300">G</kbd>
                — ungroup
            </p>
            <div class="text text-sm font-bold">Rsizing</div>
            <p>
                Hold
                <kbd class="kbd kbd-xs bg-base-300">SHIFT</kbd>
                to keep aspect ratio
            </p>
            <p>
                Hold
                <kbd class="kbd kbd-xs bg-base-300">ALT</kbd>
                to resize from center
            </p>
            <div class="text text-sm font-bold">Paint</div>
            <p>
                Hold
                <kbd class="kbd kbd-xs bg-base-300">SHIFT</kbd>
                to draw a line
            </p>
            <p>
                <kbd class="kbd kbd-xs bg-base-300">RIGHT CLICK</kbd>
                — eraser
            </p>
            <div class="text text-sm font-bold">Polygon, Triangle</div>
            <p>
                <kbd class="kbd kbd-xs bg-base-300">CLICK</kbd>
                — place vertices
            </p>
            <p>
                <kbd class="kbd kbd-xs bg-base-300">DOUBLE CLICK</kbd> or <kbd class="kbd kbd-xs bg-base-300">ESC</kbd>
                — finish
            </p>
            <p>
                <kbd class="kbd kbd-xs bg-base-300">DOUBLE CLICK</kbd>
                — edit vertices
            </p>
        </div>
    </div>
</template>
