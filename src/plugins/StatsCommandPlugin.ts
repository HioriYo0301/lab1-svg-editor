import { CliApplication } from "../cli/CliApplication.js";
import { Group } from "../shapes/Group.js";
import { Shape } from "../shapes/Shape.js";
import { CommandPlugin } from "./CommandPlugin.js";

export class StatsCommandPlugin implements CommandPlugin {
  public readonly name = "stats";
  public readonly minArgs = 0;
  public readonly maxArgs = 0;
  public readonly help = "stats";

  public execute(application: CliApplication): string {
    const document = application.currentDocument;
    if (document === null) throw new Error("no document. use 'init' or 'read' first");
    const counts = new Map<string, number>();
    let containers = 0;
    const visit = (shape: Shape): void => {
      if (shape instanceof Group) {
        containers += 1;
        for (const child of shape) visit(child);
      } else counts.set(shape.type, (counts.get(shape.type) ?? 0) + 1);
    };
    for (const shape of document) visit(shape);
    const parts = [...counts.entries()].map(([name, count]) => `${name}: ${count}`);
    return `${parts.join("  ")}${parts.length > 0 ? "  " : ""}(total ${[...counts.values()].reduce((a, b) => a + b, 0)}, containers ${containers})`;
  }
}
