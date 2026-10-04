// Inlines docs/demo/games/*.html into the GAMES block of docs/demo/index.html.
// Run after editing a game: node docs/demo/build.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const dir = path.dirname(fileURLToPath(import.meta.url));
const page = path.join(dir, "index.html");
const games = {};
for (const f of fs.readdirSync(path.join(dir, "games")).filter((f) => f.endsWith(".html")).sort()) {
  games[path.basename(f, ".html")] = fs.readFileSync(path.join(dir, "games", f), "utf8");
}
// "</script" inside a JS string would end the page's own script tag.
const json = JSON.stringify(games, null, 1).replace(/<\/script/gi, "<\\/script");
const src = fs.readFileSync(page, "utf8");
const begin = src.indexOf("// @games-begin");
const end = src.indexOf("// @games-end");
if (begin < 0 || end < 0) throw new Error("GAMES markers not found in index.html");
const header = src.slice(begin, src.indexOf("\n", begin) + 1);
fs.writeFileSync(page, src.slice(0, begin) + header + `const GAMES = ${json};\n` + src.slice(end));
// Inline the time-travel module (src/timetravel.css / .js) between its markers.
let out = fs.readFileSync(page, "utf8");
const inline = (beginMark, endMark, body) => {
  const b = out.indexOf(beginMark), e = out.indexOf(endMark);
  if (b < 0 || e < 0) throw new Error(`${beginMark} markers not found`);
  out = out.slice(0, b + beginMark.length) + "\n" + body + "\n" + out.slice(e);
};
inline("/* @tt-css-begin */", "/* @tt-css-end */", fs.readFileSync(path.join(dir, "src", "timetravel.css"), "utf8").trim());
inline("// @tt-js-begin", "// @tt-js-end", fs.readFileSync(path.join(dir, "src", "timetravel.js"), "utf8").trim().replace(/<\/script/gi, "<\\/script"));
fs.writeFileSync(page, out);
for (const [k, v] of Object.entries(games)) console.log(k.padEnd(10), Buffer.byteLength(v), "bytes");
