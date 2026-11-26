import { Group } from "./Group.js";
import { Rect } from "./Rect.js";
import { Text } from "./Text.js";
import { Shape } from "./Shape.js";
import { ShapeError } from "./ShapeError.js";

export class Box extends Group {
  public constructor(id: string, x: number, y: number, width: number, height: number, label: string) {
    super(id);
    this.addChild(new Rect(`${id}-rect`, x, y, width, height));
    this.addChild(new Text(`${id}-label`, x + width / 2, y + height / 2, label));
  }
  public get type(): string { return "box"; }
  public get rectangle(): Rect { const shape = this.childAt(0); if (!(shape instanceof Rect)) throw new ShapeError("box rectangle is missing"); return shape; }
  public get labelShape(): Text { const shape = this.childAt(1); if (!(shape instanceof Text)) throw new ShapeError("box label is missing"); return shape; }
  public setAttribute(attribute: string, value: string): void {
    if (attribute === "fill") { this.rectangle.setAttribute(attribute, value); return; }
    if (attribute === "label") { this.labelShape.setAttribute("text", value); return; }
    super.setAttribute(attribute, value);
  }
  public getAttributeValue(attribute: string): string | undefined {
    if (attribute === "fill") return this.rectangle.getAttribute("fill");
    if (attribute === "label") return this.labelShape.text;
    return super.getAttributeValue(attribute);
  }
  public restoreAttribute(attribute: string, value: string | undefined): void {
    if (attribute === "fill") { if (value === undefined) this.rectangle.restoreAttribute("fill", undefined); else this.rectangle.setAttribute("fill", value); return; }
    if (attribute === "label") { if (value === undefined) throw new ShapeError("cannot restore missing label"); this.labelShape.setAttribute("text", value); return; }
    super.restoreAttribute(attribute, value);
  }
  public toSvg(): string {
    const children = [...this].map((child) => child.toSvg()).join("");
    return `<g id="${Shape.escapeXml(this.id)}" data-kind="box">${children}</g>`;
  }
  public describe(): string { return `g#${this.id}`; }
}
