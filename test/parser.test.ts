import { describe, expect, it } from "vitest";
import { CommandParser } from "../src/cli/CommandParser.js";
import { ParseError } from "../src/cli/ParseError.js";
import { Tokenizer } from "../src/cli/Tokenizer.js";

describe("Tokenizer", () => {
  const tokenizer = new Tokenizer();

  it("splits regular arguments and preserves quoted spaces", () => {
    expect(tokenizer.tokenize('create text title 20 40 "My Diagram"')).toEqual([
      "create", "text", "title", "20", "40", "My Diagram",
    ]);
  });

  it("ignores blank lines and full-line comments", () => {
    expect(tokenizer.tokenize("   ")).toEqual([]);
    expect(tokenizer.tokenize("  # this is a comment")).toEqual([]);
  });

  it("keeps a color beginning with # as an argument", () => {
    expect(tokenizer.tokenize("create rect r1 0 0 10 10 #ffffff")).toContain("#ffffff");
  });

  it("supports escaped quotes inside quoted text", () => {
    expect(tokenizer.tokenize('create text t1 0 0 "say \\"hi\\""')).toEqual([
      "create", "text", "t1", "0", "0", 'say "hi"',
    ]);
  });

  it("rejects an unterminated quote", () => {
    expect(() => tokenizer.tokenize('create text t1 0 0 "missing')).toThrow(ParseError);
  });
});

describe("CommandParser", () => {
  const parser = new CommandParser();

  it("returns a structured command", () => {
    expect(parser.parse('create text title 20 40 "My Diagram"')).toEqual({
      name: "create",
      args: ["text", "title", "20", "40", "My Diagram"],
    });
  });

  it("returns null for blank lines and comments", () => {
    expect(parser.parse("   ")).toBeNull();
    expect(parser.parse("# comment")).toBeNull();
  });

  it("rejects unknown commands and invalid argument counts", () => {
    expect(() => parser.parse("explode now")).toThrow("unknown command: explode");
    expect(() => parser.parse("move r1 10")).toThrow("invalid arguments for move");
    expect(() => parser.parse("help extra")).toThrow("invalid arguments for help");
  });
});
