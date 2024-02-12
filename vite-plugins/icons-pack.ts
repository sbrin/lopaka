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
            const icons = [];
            for (let i = 0; i < files.length; i++) {
                const fileName = path.resolve(sourceDir, files[i]);
                const stream = fs.createReadStream(fileName);
                const icon = fs.readFileSync(fileName);
                const iconData: any = iconReg.exec(files[i]);
                if (iconData) {
                    const info = await probe(stream);
                    console.log(info);
                    icons.push({
                        name: iconData[1],
                        width: info.width,
                        height: info.height,
                        image: `data:${info.mime};base64,${icon.toString('base64')}`
                    });
                }
            }
            return {
                code: `
/*
    @author: ${meta.author}
    @link: ${meta.link}
    @license: ${meta.license}   
*/
export default ${JSON.stringify(icons)}`,
                map: null
            };
        }
    }
};
export default iconsPackPlugin;
