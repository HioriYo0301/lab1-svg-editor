import { SvgDocument } from "../document/SvgDocument.js";
import { Command } from "./Command.js";

export class ScaleCommand implements Command {
  public constructor(private readonly document: SvgDocument, private readonly id: string, private readonly factor: number) {}
  public execute(): string {
    const shape = this.document.requireById(this.id);
    shape.scale(this.factor);
    return `${shape.type}#${shape.id} scaled by ${this.factor}`;
  }
  public undo(): string {
    const shape = this.document.requireById(this.id);
    shape.scale(1 / this.factor);
    return `${shape.type}#${shape.id} scaled back by ${1 / this.factor}`;
  }
}
