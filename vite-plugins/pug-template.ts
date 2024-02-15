import {Plugin} from 'vite';
import pug from 'pug';

const ext = /\.pug$/;

const pugTemplatePlugin: Plugin = {
    name: '.pug',
    transform(code, id) {
        if (ext.test(id)) {
            const template = pug.compile(code, {debug: false, compileDebug: false});
            return {
                code: `const pug = {rethrow: (...args) => console.warn(args)};
export default ${template}`,
                map: null
            };
        }
    }
};
export default pugTemplatePlugin;
