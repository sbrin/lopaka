import {Plugin} from 'vite';
import path from 'path';
import fs from 'fs';
import probe from 'probe-image-size';
const packExt = /\.icons\.pack$/;
const iconReg = /(.*?)_(\d+)x(\d+).png/;

const iconsPackPlugin: Plugin = {
    name: 'icons.pack',
    async transform(code, id) {
        if (packExt.test(id)) {
            const dir = path.dirname(id);
            const meta: any = code.split('\n').reduce((acc, cur) => {
                if (cur.length) {
                    acc[cur.split(':')[0]] = cur.split(':')[1].trim();
                }
                return acc;
            }, {});
            const sourceDir = path.resolve(dir, meta.source);
            const files = fs.readdirSync(sourceDir);
            let icons = [];
            for (let i = 0; i < files.length; i++) {
                const fileName = path.resolve(sourceDir, files[i]);
                const stream = fs.createReadStream(fileName);
                const icon = fs.readFileSync(fileName);
                const iconData: any = iconReg.exec(files[i]);
                if (iconData) {
                    const info = await probe(stream);
                    icons.push([
                        iconData[1],
                        info.width,
                        info.height,
                        `data:${info.mime};base64,${icon.toString('base64')}`
                    ]);
                }
            }
            if (meta.sort && meta.sort == 'dimensions') {
                icons = icons.sort((a, b) => {
                    return a[1] * a[2] - b[1] * b[2];
                });
            } else if (meta.sort && meta.sort == 'name') {
                icons = icons.sort((a, b) => {
                    return a[0].localeCompare(b[0]);
                });
            }
            return {
                code: `
/*
    @author: ${meta.author}
    @link: ${meta.link}
    @license: ${meta.license}   
*/
export default ${JSON.stringify(icons)}.map(([name, width, height, image]) => ({name,width,height,image}));`,
                map: null
            };
        }
    }
};
export default iconsPackPlugin;
