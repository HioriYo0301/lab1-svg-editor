import { Circle } from "./Circle.js";
import { Ellipse } from "./Ellipse.js";
import { Group } from "./Group.js";
import { Line } from "./Line.js";
import { Rect } from "./Rect.js";
import { Shape } from "./Shape.js";
import { ShapeError } from "./ShapeError.js";
import { Text } from "./Text.js";

export class ShapeFactory {
  public create(type: string, id: string, parameters: readonly string[]): Shape {
    switch (type) {
      case "rect": return this.createRect(id, parameters);
      case "circle": return this.createCircle(id, parameters);
      case "ellipse": return this.createEllipse(id, parameters);
      case "line": return this.createLine(id, parameters);
      case "text": return this.createText(id, parameters);
      case "g": return this.createGroup(id, parameters);
      default: throw new ShapeError(`unknown shape type: ${type} (is the plugin loaded?)`);
    }
  }

  private createRect(id: string, parameters: readonly string[]): Shape {
    this.requireParameterCount("rect", parameters, 4, 5);
    const shape = new Rect(id, this.number(parameters[0], "x"), this.number(parameters[1], "y"), this.number(parameters[2], "width"), this.number(parameters[3], "height"));
    if (parameters[4] !== undefined) shape.setAttribute("fill", parameters[4]);
    return shape;
  }

  private createCircle(id: string, parameters: readonly string[]): Shape {
    this.requireParameterCount("circle", parameters, 3, 4);
    const shape = new Circle(id, this.number(parameters[0], "cx"), this.number(parameters[1], "cy"), this.number(parameters[2], "r"));
    if (parameters[3] !== undefined) shape.setAttribute("fill", parameters[3]);
    return shape;
  }

  private createEllipse(id: string, parameters: readonly string[]): Shape {
    this.requireParameterCount("ellipse", parameters, 4, 5);
    const shape = new Ellipse(id, this.number(parameters[0], "cx"), this.number(parameters[1], "cy"), this.number(parameters[2], "rx"), this.number(parameters[3], "ry"));
    if (parameters[4] !== undefined) shape.setAttribute("fill", parameters[4]);
    return shape;
  }

  private createLine(id: string, parameters: readonly string[]): Shape {
    this.requireParameterCount("line", parameters, 4, 5);
    const shape = new Line(id, this.number(parameters[0], "x1"), this.number(parameters[1], "y1"), this.number(parameters[2], "x2"), this.number(parameters[3], "y2"));
    if (parameters[4] !== undefined) shape.setAttribute("stroke", parameters[4]);
    return shape;
  }

  private createText(id: string, parameters: readonly string[]): Shape {
    this.requireParameterCount("text", parameters, 3, 3);
    return new Text(id, this.number(parameters[0], "x"), this.number(parameters[1], "y"), parameters[2]);
  }

  private createGroup(id: string, parameters: readonly string[]): Shape {
    this.requireParameterCount("g", parameters, 0, 0);
    return new Group(id);
  }

  private number(value: string | undefined, name: string): number {
    const parsed = Number(value);
    if (value === undefined || !Number.isFinite(parsed)) throw new ShapeError(`${name} must be a finite number`);
    return parsed;
  }

  private requireParameterCount(type: string, parameters: readonly string[], minimum: number, maximum: number): void {
    if (parameters.length < minimum || parameters.length > maximum) {
      const expected = minimum === maximum ? `${minimum}` : `${minimum}-${maximum}`;
      throw new ShapeError(`invalid arguments for create ${type}: expected ${expected}, got ${parameters.length}`);
    }
  }
}
