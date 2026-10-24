import { CommandRegistry, CommandSpec } from "./CommandRegistry.js";
import { ParseError } from "./ParseError.js";
import { Tokenizer } from "./Tokenizer.js";

export interface ParsedCommand {
  readonly name: string;
  readonly args: readonly string[];
}

export class CommandParser {
  private readonly tokenizer: Tokenizer;

  public constructor(
    private readonly registry = CommandRegistry.default(),
    tokenizer = new Tokenizer(),
  ) {
    this.tokenizer = tokenizer;
  }

  public parse(line: string): ParsedCommand | null {
    const tokens = this.tokenizer.tokenize(line);
    if (tokens.length === 0) return null;

    const [name, ...args] = tokens;
    const spec = this.registry.find(name);
    if (spec === undefined) throw new ParseError(`unknown command: ${name}`);
    this.validateArguments(spec, args.length);
    return { name, args };
  }

  private validateArguments(spec: CommandSpec, count: number): void {
    if (count < spec.minArgs || count > spec.maxArgs) {
      const expected = spec.minArgs === spec.maxArgs
        ? `${spec.minArgs}`
        : `${spec.minArgs}-${spec.maxArgs === Number.MAX_SAFE_INTEGER ? "many" : spec.maxArgs}`;
      throw new ParseError(`invalid arguments for ${spec.name}: expected ${expected}, got ${count}`);
    }
  }
}
