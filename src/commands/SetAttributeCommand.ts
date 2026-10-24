import { SvgDocument } from "../document/SvgDocument.js";
import { Command } from "./Command.js";

export class SetAttributeCommand implements Command {
  private oldValue: string | undefined;
  private captured = false;
  public constructor(private readonly document: SvgDocument, private readonly id: string, private readonly attribute: string, private readonly value: string) {}
  public execute(): string {
    const shape = this.document.requireById(this.id);
    if (!this.captured) {
      this.oldValue = shape.getAttributeValue(this.attribute);
      this.captured = true;
    }
    shape.setAttribute(this.attribute, this.value);
    return `${shape.type}#${shape.id} updated: ${this.attribute}=${this.value}`;
  }
  public undo(): string {
    const shape = this.document.requireById(this.id);
    shape.restoreAttribute(this.attribute, this.oldValue);
    return `${shape.type}#${shape.id} restored: ${this.attribute}`;
  }
}
