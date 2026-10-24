import { Shape } from "./Shape.js";
import { ShapeError } from "./ShapeError.js";

export class Line extends Shape {
  public constructor(id: string, private startX: number, private startY: number, private endX: number, private endY: number) {
    super(id); this.requireFiniteNumber(startX, "x1"); this.requireFiniteNumber(startY, "y1"); this.requireFiniteNumber(endX, "x2"); this.requireFiniteNumber(endY, "y2");
  }
  public get type(): string { return "line"; }
  public get x1(): number { return this.startX; }
  public get y1(): number { return this.startY; }
  public get x2(): number { return this.endX; }
  public get y2(): number { return this.endY; }
  public toSvg(): string { return `<line id="${Shape.escapeXml(this.id)}" x1="${this.startX}" y1="${this.startY}" x2="${this.endX}" y2="${this.endY}"${this.commonAttributes()}/>`; }
  public describe(): string { return `line#${this.id} (${this.startX},${this.startY}) -> (${this.endX},${this.endY})`; }
  protected moveGeometry(dx: number, dy: number): void { this.startX += dx; this.startY += dy; this.endX += dx; this.endY += dy; }
  protected scaleGeometry(factor: number): void { this.startX *= factor; this.startY *= factor; this.endX *= factor; this.endY *= factor; }
  protected setGeometryAttribute(attribute: string, value: string): void {
    const parsed = this.parseFiniteNumber(value, attribute);
    switch (attribute) {
      case "x1": this.startX = parsed; break;
      case "y1": this.startY = parsed; break;
      case "x2": this.endX = parsed; break;
      case "y2": this.endY = parsed; break;
      default: throw new ShapeError(`unknown attribute: ${attribute}`);
    }
  }
}
