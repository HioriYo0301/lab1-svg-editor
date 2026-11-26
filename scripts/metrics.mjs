import { execFileSync } from "node:child_process";
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";

const root = process.cwd();
const files = execFileSync("git", ["ls-files", "src", "vscode-extension/src"], { encoding: "utf8" }).trim().split(/\r?\n/).filter(Boolean);
const rows = files.map((file) => {
  const text = readFileSync(join(root, file), "utf8");
  const category = file.startsWith("vscode-extension/") ? "vscode-extension" : file.includes("plugins") ? "plugin" : file.includes("cli") || file === "src/main.ts" ? "assembly" : "core";
  return { file, category, lines: text.split(/\r?\n/).length };
});
const totals = Object.fromEntries(["core", "assembly", "plugin", "vscode-extension"].map((category) => [category, rows.filter((row) => row.category === category).reduce((sum, row) => sum + row.lines, 0)]));
const output = { generatedAt: new Date().toISOString(), scope: "tracked source files; dependencies and build output excluded", totals, files: rows };
const directory = join(root, "doc", "metrics");
mkdirSync(directory, { recursive: true });
writeFileSync(join(directory, "phase2.json"), JSON.stringify(output, null, 2) + "\n");
console.log(JSON.stringify({ totals, files: rows.length }, null, 2));
