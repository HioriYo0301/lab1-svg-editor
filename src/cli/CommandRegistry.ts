export interface CommandSpec {
  readonly name: string;
  readonly minArgs: number;
  readonly maxArgs: number;
}

export class CommandRegistry {
  private readonly specs = new Map<string, CommandSpec>();

  public register(name: string, minArgs: number, maxArgs = minArgs): void {
    if (!/^\S+$/.test(name)) throw new Error("command name must not be empty");
    if (!Number.isInteger(minArgs) || minArgs < 0 || !Number.isInteger(maxArgs) || maxArgs < minArgs) {
      throw new Error(`invalid argument range for command: ${name}`);
    }
    this.specs.set(name, { name, minArgs, maxArgs });
  }

  public find(name: string): CommandSpec | undefined {
    return this.specs.get(name);
  }

  public static default(): CommandRegistry {
    const registry = new CommandRegistry();
    registry.register("init", 0, 2);
    registry.register("read", 1);
    registry.register("save", 0, 1);
    registry.register("canvas", 0, 2);
    registry.register("create", 2, Number.MAX_SAFE_INTEGER);
    registry.register("delete", 1);
    registry.register("move", 3);
    registry.register("scale", 2);
    registry.register("set", 3);
    registry.register("group", 2, Number.MAX_SAFE_INTEGER);
    registry.register("ungroup", 1);
    registry.register("addto", 2);
    registry.register("front", 1);
    registry.register("back", 1);
    registry.register("tree", 0, 1);
    registry.register("show", 1);
    registry.register("help", 0);
    registry.register("undo", 0);
    registry.register("redo", 0);
    return registry;
  }
}
