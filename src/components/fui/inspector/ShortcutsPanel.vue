<template>
    <div>
        <div class="text-lg pb-2">Shortcuts</div>
        <div class="text-xs flex flex-col gap-1 text-gray-300">
            <p>
                <kbd class="kbd kbd-xs bg-base-300">Delete</kbd>
                <kbd class="kbd kbd-xs bg-base-300">Backspace</kbd>
                — remove
            </p>
            <p>
                <kbd class="kbd kbd-xs bg-base-300">←</kbd>
                <kbd class="kbd kbd-xs bg-base-300">→</kbd>
                <kbd class="kbd kbd-xs bg-base-300">↑</kbd>
                <kbd class="kbd kbd-xs bg-base-300">↓</kbd>
                — move 1px
            </p>
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
                — copy/paste
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
            <div class="text text-sm font-bold">Rectangle</div>
            <p>
                Hold
                <kbd class="kbd kbd-xs bg-base-300">SHIFT</kbd>
                to draw a square
            </p>
            <div class="text text-sm font-bold">Ellipse</div>
            <p>
                Hold
                <kbd class="kbd kbd-xs bg-base-300">SHIFT</kbd>
                to draw a circle
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
        </div>
    </div>
</template>
