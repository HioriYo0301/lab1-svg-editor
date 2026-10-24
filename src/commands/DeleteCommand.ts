import { SvgDocument } from "../document/SvgDocument.js";
import { ShapePlacement } from "../document/ShapePlacement.js";
import { Command } from "./Command.js";

export class DeleteCommand implements Command {
  private placement: ShapePlacement | undefined;
  public constructor(private readonly document: SvgDocument, private readonly id: string) {}
  public execute(): string {
    const shape = this.document.requireById(this.id);
    this.placement = this.document.remove(shape);
    return `${shape.type}#${shape.id} deleted`;
  }
}
