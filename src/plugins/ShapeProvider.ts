import { Shape } from "../shapes/Shape.js";

export interface ShapeProvider {
  readonly name: string;
  create(id: string, parameters: readonly string[]): Shape;
}
