import { Shape } from "../shapes/Shape.js";
import { TreeDecorator } from "./TreeDecorator.js";

export class ModifiedStarDecorator implements TreeDecorator {
  public readonly name = "modified-star";
  private readonly modifiedIds = new Set<string>();
  public mark(id: string): void { this.modifiedIds.add(id); }
  public clear(): void { this.modifiedIds.clear(); }
  public setDirty(ids: readonly string[]): void { this.modifiedIds.clear(); for (const id of ids) this.modifiedIds.add(id); }
  public decorate(shape: Shape, label: string): string { return this.modifiedIds.has(shape.id) ? `${label} *` : label; }
}
