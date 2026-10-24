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
  public undo(): string {
    if (this.placement === undefined) throw new Error("delete command has not been executed");
    this.document.restore(this.placement);
    return `${this.placement.shape.type}#${this.placement.shape.id} restored`;
  }
}
