import { AttributeHandler } from "./AttributeHandler.js";
import { PluginContext } from "./PluginContext.js";
import { ShapeProvider } from "./ShapeProvider.js";
import { Box } from "../shapes/Box.js";
import { ShapeError } from "../shapes/ShapeError.js";

export class BoxShapeProvider implements ShapeProvider {
  public readonly name = "box";
  public create(id: string, parameters: readonly string[]): Box {
    if (parameters.length !== 5) throw new ShapeError(`invalid arguments for create box: expected 5, got ${parameters.length}`);
    const values = parameters.slice(0, 4).map(Number);
    if (values.some((value) => !Number.isFinite(value))) throw new ShapeError("box geometry must be finite numbers");
    return new Box(id, values[0]!, values[1]!, values[2]!, values[3]!, parameters[4]!);
  }
}

export class BoxAttributeHandler implements AttributeHandler {
  public readonly name = "box-attributes";
  public handles(shapeId: string, attribute: string): boolean { return shapeId.length > 0 && (attribute === "fill" || attribute === "label"); }
  public apply(_shapeId: string, _attribute: string, _value: string): void { /* Box performs the public domain operation. */ }
}

export function activateBoxPlugin(context: PluginContext): void {
  context.registerShape(new BoxShapeProvider());
  context.registerAttribute(new BoxAttributeHandler());
}
