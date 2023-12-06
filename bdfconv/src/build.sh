#!/bin/sh
# make sure you have emscripten installed (brew install emscripten)
# emcc bdf_font.c bdf_glyph.c bdf_parser.c bdf_map.c bdf_rle.c bdf_tga.c fd.c bdf_8x8.c bdf_kern.c main.c --no-entry -o bdfconv.wasm
emcc bdf_font.c bdf_glyph.c bdf_parser.c bdf_map.c bdf_rle.c bdf_tga.c fd.c bdf_8x8.c bdf_kern.c main.c -o bdfconv.js -s MODULARIZE=1 -s EXPORT_ES6=1 -s ENVIRONMENT='web' -s EXPORTED_RUNTIME_METHODS=['callMain']
cp ./bdfconv.wasm ../wasm/
cp ./bdfconv.js ../wasm/

# emcc sum.c -o sum.mjs -s MODULARIZE=1 -s EXPORT_ES6=1 -s ENVIRONMENT='web' -s EXPORTED_RUNTIME_METHODS=['callMain'] -s


