import { ParseError } from "./ParseError.js";

export class Tokenizer {
  public tokenize(line: string): string[] {
    const firstMeaningful = line.search(/\S/);
    if (firstMeaningful < 0 || line[firstMeaningful] === "#") return [];

    const tokens: string[] = [];
    let current = "";
    let quoted = false;
    let escaping = false;

    for (const character of line) {
      if (escaping) {
        current += character;
        escaping = false;
        continue;
      }
      if (character === "\\" && quoted) {
        escaping = true;
        continue;
      }
      if (character === '"') {
        quoted = !quoted;
        continue;
      }
      if (/\s/.test(character) && !quoted) {
        if (current.length > 0) {
          tokens.push(current);
          current = "";
        }
        continue;
      }
      current += character;
    }

    if (escaping) current += "\\";
    if (quoted) throw new ParseError("unterminated quoted argument");
    if (current.length > 0) tokens.push(current);
    return tokens;
  }
}
