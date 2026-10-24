import { Group } from "../shapes/Group.js";
import { Shape } from "../shapes/Shape.js";

export interface ShapePlacement {
  readonly shape: Shape;
  readonly parent: Group | null;
  readonly index: number;
}
