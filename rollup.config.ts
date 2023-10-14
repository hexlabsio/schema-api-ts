import typescript from '@rollup/plugin-typescript';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';

export default {
    input: ['src/index.ts', 'src/cli.ts'],
    output: {
        dir: 'dist',
        format: 'esm',
        entryFileNames: '[name].mjs'
    },
    plugins: [
        json({ compact: true }),
        typescript(),
        commonjs(),
        resolve({ preferBuiltins: true, exportConditions: ['node'] }),
    ]
};