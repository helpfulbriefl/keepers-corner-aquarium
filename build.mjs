// usage: node build.mjs out.html [tailFile] [partPrefixes...]
import fs from 'fs';
const [out, tail, ...only] = process.argv.slice(2);
const files = fs.readdirSync('src').filter(f => f.endsWith('.js')).sort().filter(f => !only.length || only.some(p => f.startsWith(p)));
let html = fs.readFileSync('src/head.html', 'utf8');
for (const f of files) html += `\n/* ---- ${f} ---- */\n` + fs.readFileSync('src/' + f, 'utf8');
if (tail && tail !== '-') html += '\n' + fs.readFileSync(tail, 'utf8');
html += '\n</script>\n</body>\n</html>\n';
fs.writeFileSync(out, html);
console.log('built', out, files.join(','), (html.length / 1024).toFixed(1) + 'KB');
