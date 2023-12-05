#!/bin/sh
# make sure you have emscripten installed (brew install emscripten)
emcc bdf_font.c bdf_glyph.c bdf_parser.c bdf_map.c bdf_rle.c bdf_tga.c fd.c bdf_8x8.c bdf_kern.c main.c --no-entry -o bdfconv.wasm
cp ./bdfconv.wasm ../wasm/