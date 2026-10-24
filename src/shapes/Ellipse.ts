import { Shape } from "./Shape.js";
import { ShapeError } from "./ShapeError.js";

export class Ellipse extends Shape {
  public constructor(id: string, private centerX: number, private centerY: number, private radiusX: number, private radiusY: number) {
    super(id); this.requireFiniteNumber(centerX, "cx"); this.requireFiniteNumber(centerY, "cy"); this.requireFiniteNumber(radiusX, "rx"); this.requireFiniteNumber(radiusY, "ry");
    if (radiusX < 0 || radiusY < 0) throw new ShapeError("ellipse radii must not be negative");
  }
  public get type(): string { return "ellipse"; }
  public get cx(): number { return this.centerX; }
  public get cy(): number { return this.centerY; }
  public get rx(): number { return this.radiusX; }
  public get ry(): number { return this.radiusY; }
  public toSvg(): string { return `<ellipse id="${Shape.escapeXml(this.id)}" cx="${this.centerX}" cy="${this.centerY}" rx="${this.radiusX}" ry="${this.radiusY}"${this.commonAttributes()}/>`; }
  public describe(): string { return `ellipse#${this.id} cx=${this.centerX} cy=${this.centerY} rx=${this.radiusX} ry=${this.radiusY}${this.commonDescription()}`; }
  protected moveGeometry(dx: number, dy: number): void { this.centerX += dx; this.centerY += dy; }
  protected scaleGeometry(factor: number): void { this.centerX *= factor; this.centerY *= factor; this.radiusX *= factor; this.radiusY *= factor; }
  protected setGeometryAttribute(attribute: string, value: string): void {
    switch (attribute) {
      case "cx": this.centerX = this.parseFiniteNumber(value, attribute); break;
      case "cy": this.centerY = this.parseFiniteNumber(value, attribute); break;
      case "rx": {
        const parsed = this.parseFiniteNumber(value, attribute);
        if (parsed < 0) throw new ShapeError("rx must not be negative");
        this.radiusX = parsed;
        break;
      }
      case "ry": {
        const parsed = this.parseFiniteNumber(value, attribute);
        if (parsed < 0) throw new ShapeError("ry must not be negative");
        this.radiusY = parsed;
        break;
      }
      default: throw new ShapeError(`unknown attribute: ${attribute}`);
    }
  }

  protected geometryAttributeValue(attribute: string): string | undefined {
    switch (attribute) { case "cx": return String(this.centerX); case "cy": return String(this.centerY); case "rx": return String(this.radiusX); case "ry": return String(this.radiusY); default: return undefined; }
  }
}
