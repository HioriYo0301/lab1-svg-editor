import { describe, expect, it } from "vitest";
import { History } from "../src/history/History.js";
import { Command } from "../src/commands/Command.js";

class CounterCommand implements Command {
  public constructor(private readonly state: { value: number }) {}
  public execute(): string { this.state.value += 1; return "executed"; }
  public undo(): string { this.state.value -= 1; return "undone"; }
}

describe("History", () => {
  it("moves commands between undo and redo stacks", () => {
    const state = { value: 0 };
    const history = new History();
    history.execute(new CounterCommand(state));
    expect(state.value).toBe(1);
    history.undo();
    expect(state.value).toBe(0);
    history.redo();
    expect(state.value).toBe(1);
  });
});
