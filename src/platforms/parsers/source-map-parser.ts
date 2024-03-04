export class SourceMapParser {
    // extract layer id from code line
    protected layerNameRegex = /^@([\d\w]+);/g;
    // extract layer params from code line
    protected paramsRegex = /@(\w+):/g;

    parse(code: string): TSourceCode {
        let layersMap = {};
        const lines = code.split('\n');
        const result = [];
        for (let i = 0; i < lines.length; i++) {
            let line = lines[i];
            const match = this.layerNameRegex.exec(line);
            if (match?.length > 1) {
                const id = match[1];
                const map = {line: i, params: {}};
                line = line.replace(this.layerNameRegex, '');
                const paramsMatch = line.match(this.paramsRegex);
                if (paramsMatch?.length > 0) {
                    paramsMatch.forEach((p) => {
                        const param = line.indexOf(p);
                        line = line.replace(p, '');
                        map.params[p.replace('@', '').replace(':', '')] = param;
                    });
                }
                layersMap[id] = map;
            }
            result.push(line);
        }
        return {map: layersMap, code: result.join('\n')};
    }
}
