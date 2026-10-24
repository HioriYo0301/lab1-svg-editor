import { Shape } from "./Shape.js";
import { ShapeError } from "./ShapeError.js";

export class Text extends Shape {
  public constructor(id: string, private textX: number, private textY: number, private content: string) {
    super(id); this.requireFiniteNumber(textX, "x"); this.requireFiniteNumber(textY, "y");
  }
  public get type(): string { return "text"; }
  public get x(): number { return this.textX; }
  public get y(): number { return this.textY; }
  public get text(): string { return this.content; }
  public toSvg(): string { return `<text id="${Shape.escapeXml(this.id)}" x="${this.textX}" y="${this.textY}"${this.commonAttributes()}>${Shape.escapeXml(this.content)}</text>`; }
  public describe(): string { return `text#${this.id} (${this.textX},${this.textY}) "${this.content}"${this.commonDescription()}`; }
  protected moveGeometry(dx: number, dy: number): void { this.textX += dx; this.textY += dy; }
  protected scaleGeometry(factor: number): void { this.textX *= factor; this.textY *= factor; }
  protected setGeometryAttribute(attribute: string, value: string): void {
    if (attribute === "text") { this.content = value; return; }
    switch (attribute) {
      case "x": this.textX = this.parseFiniteNumber(value, attribute); break;
      case "y": this.textY = this.parseFiniteNumber(value, attribute); break;
      default: throw new ShapeError(`unknown attribute: ${attribute}`);
    }
  }
}
