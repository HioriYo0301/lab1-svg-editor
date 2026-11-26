import { Shape } from "../shapes/Shape.js";

export interface TreeDecorator {
  readonly name: string;
  decorate(shape: Shape, label: string): string;
}
