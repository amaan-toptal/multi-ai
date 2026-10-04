// Pull "artifacts" out of a model response. For the POC an artifact is any
// fenced code block; HTML/SVG blocks are previewable in a sandboxed iframe.
const EXT = {
  html: "html", htm: "html", svg: "svg", xml: "xml", css: "css",
  js: "js", javascript: "js", jsx: "jsx", ts: "ts", typescript: "ts", tsx: "tsx",
  py: "py", python: "py", json: "json", md: "md", markdown: "md", sh: "sh", bash: "sh",
  shell: "sh", yaml: "yaml", yml: "yaml", sql: "sql", go: "go", rust: "rs", rs: "rs",
  java: "java", c: "c", cpp: "cpp", rb: "rb", ruby: "rb", php: "php", toml: "toml",
  mermaid: "mmd", csv: "csv", txt: "txt", text: "txt",
};

export function extractArtifacts(text) {
  const out = [];
  const re = /```([\w+-]*)[^\n]*\n([\s\S]*?)```/g;
  let m;
  while ((m = re.exec(text))) {
    const lang = (m[1] || "txt").toLowerCase();
    const body = m[2];
    if (body.trim().split("\n").length < 3) continue; // skip one-liners / inline snippets
    const ext = EXT[lang] || "txt";
    const n = String(out.length + 1).padStart(2, "0");
    out.push({
      name: `artifact-${n}.${ext}`,
      lang,
      previewable: ext === "html" || ext === "svg",
      content: body,
    });
  }
  return out;
}
