import {readFileSync} from 'fs';
import {Plugin} from 'vite';
import {compileTemplate} from 'vue/compiler-sfc';
const ext = /\.svg\?component$/;
const svgIconsPlugin: Plugin = {
    name: 'svg',
    transform(code, id) {
        if (ext.test(id)) {
            const source = readFileSync(id.replace('?component', '')).toString();
            const compiled = compileTemplate({
                source,
                filename: id,
                id
            });
            return {
                code: `${compiled.code}
export default render;`,
                map: compiled.map
            };
        }
    }
};
export default svgIconsPlugin;