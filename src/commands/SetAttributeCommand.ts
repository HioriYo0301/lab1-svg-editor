import { SvgDocument } from "../document/SvgDocument.js";
import { Command } from "./Command.js";

export class SetAttributeCommand implements Command {
  public constructor(private readonly document: SvgDocument, private readonly id: string, private readonly attribute: string, private readonly value: string) {}
  public execute(): string {
    const shape = this.document.requireById(this.id);
    shape.setAttribute(this.attribute, this.value);
    return `${shape.type}#${shape.id} updated: ${this.attribute}=${this.value}`;
  }
}
