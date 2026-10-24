import { Shape } from "./Shape.js";
import { ShapeError } from "./ShapeError.js";

export class Rect extends Shape {
  public constructor(id: string, private rectX: number, private rectY: number, private rectWidth: number, private rectHeight: number) {
    super(id);
    this.requireFiniteNumber(rectX, "x"); this.requireFiniteNumber(rectY, "y");
    this.requireFiniteNumber(rectWidth, "width"); this.requireFiniteNumber(rectHeight, "height");
    if (rectWidth < 0 || rectHeight < 0) throw new ShapeError("rect dimensions must not be negative");
  }
  public get type(): string { return "rect"; }
  public get x(): number { return this.rectX; }
  public get y(): number { return this.rectY; }
  public get width(): number { return this.rectWidth; }
  public get height(): number { return this.rectHeight; }
  public toSvg(): string { return `<rect id="${Shape.escapeXml(this.id)}" x="${this.rectX}" y="${this.rectY}" width="${this.rectWidth}" height="${this.rectHeight}"${this.commonAttributes()}/>`; }
  public describe(): string { return `rect#${this.id} x=${this.rectX} y=${this.rectY} w=${this.rectWidth} h=${this.rectHeight}${this.commonDescription()}`; }
  protected moveGeometry(dx: number, dy: number): void { this.rectX += dx; this.rectY += dy; }
  protected scaleGeometry(factor: number): void { this.rectX *= factor; this.rectY *= factor; this.rectWidth *= factor; this.rectHeight *= factor; }
  protected setGeometryAttribute(attribute: string, value: string): void {
    const parsed = this.parseFiniteNumber(value, attribute);
    if ((attribute === "width" || attribute === "height") && parsed < 0) throw new ShapeError(`${attribute} must not be negative`);
    switch (attribute) {
      case "x": this.rectX = parsed; break;
      case "y": this.rectY = parsed; break;
      case "width": this.rectWidth = parsed; break;
      case "height": this.rectHeight = parsed; break;
      default: throw new ShapeError(`unknown attribute: ${attribute}`);
    }
  }
}
