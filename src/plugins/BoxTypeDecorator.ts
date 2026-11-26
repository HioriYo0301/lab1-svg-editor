import { Shape } from "../shapes/Shape.js";
import { Box } from "../shapes/Box.js";
import { TreeDecorator } from "./TreeDecorator.js";

export class BoxTypeDecorator implements TreeDecorator {
  public readonly name = "box-type-label";
  public decorate(shape: Shape, label: string): string { return shape instanceof Box ? `${label} (box)` : label; }
}
