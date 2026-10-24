import { Shape } from "./Shape.js";
import { ShapeError } from "./ShapeError.js";

export class Circle extends Shape {
  public constructor(id: string, private centerX: number, private centerY: number, private radius: number) {
    super(id); this.requireFiniteNumber(centerX, "cx"); this.requireFiniteNumber(centerY, "cy"); this.requireFiniteNumber(radius, "r");
    if (radius < 0) throw new ShapeError("r must not be negative");
  }
  public get type(): string { return "circle"; }
  public get cx(): number { return this.centerX; }
  public get cy(): number { return this.centerY; }
  public get r(): number { return this.radius; }
  public toSvg(): string { return `<circle id="${Shape.escapeXml(this.id)}" cx="${this.centerX}" cy="${this.centerY}" r="${this.radius}"${this.commonAttributes()}/>`; }
  public describe(): string { return `circle#${this.id} cx=${this.centerX} cy=${this.centerY} r=${this.radius}`; }
  protected moveGeometry(dx: number, dy: number): void { this.centerX += dx; this.centerY += dy; }
  protected scaleGeometry(factor: number): void { this.centerX *= factor; this.centerY *= factor; this.radius *= factor; }
  protected setGeometryAttribute(attribute: string, value: string): void {
    const parsed = this.parseFiniteNumber(value, attribute);
    switch (attribute) {
      case "cx": this.centerX = parsed; break;
      case "cy": this.centerY = parsed; break;
      case "r": if (parsed < 0) throw new ShapeError("r must not be negative"); this.radius = parsed; break;
      default: throw new ShapeError(`unknown attribute: ${attribute}`);
    }
  }
}
