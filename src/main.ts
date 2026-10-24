import { createInterface } from "node:readline";
import { CliApplication } from "./cli/CliApplication.js";

const application = new CliApplication();
console.log("svg-editor 0.1 — type 'help' for commands");

const interactive = process.stdin.isTTY;
const readline = createInterface({ input: process.stdin, output: process.stdout, prompt: "svg> " });
if (interactive) readline.prompt();
readline.on("line", (line) => {
  try {
    const output = application.handleLine(line);
    if (output !== null) console.log(output);
  } catch (error) {
    console.log(`error: ${error instanceof Error ? error.message : String(error)}`);
  }
  if (interactive) readline.prompt();
});
