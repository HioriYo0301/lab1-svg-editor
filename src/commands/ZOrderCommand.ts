import { SvgDocument } from "../document/SvgDocument.js";
import { Command } from "./Command.js";

export type ZOrder = "front" | "back";

export class ZOrderCommand implements Command {
  private oldIndex: number | undefined;
  public constructor(private readonly document: SvgDocument, private readonly id: string, private readonly order: ZOrder) {}
  public execute(): string {
    const shape = this.document.requireById(this.id);
    const targetIndex = this.order === "front" ? this.document.siblingCount(shape) - 1 : 0;
    this.oldIndex = this.document.reorder(shape, targetIndex);
    return `${shape.type}#${shape.id} moved to ${this.order}`;
  }
  public undo(): string {
    const shape = this.document.requireById(this.id);
    if (this.oldIndex === undefined) throw new Error("z-order command has not been executed");
    this.document.reorder(shape, this.oldIndex);
    return `${shape.type}#${shape.id} z-order restored`;
  }
}
