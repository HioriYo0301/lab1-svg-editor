import { ShapeError } from "./ShapeError.js";
import type { Group } from "./Group.js";

export type CommonAttribute = "fill" | "stroke" | "stroke-width";

export abstract class Shape {
  private parentShape: Group | null = null;
  private readonly attributes = new Map<CommonAttribute, string>();

  protected constructor(private readonly shapeId: string) {
    if (shapeId.length === 0) throw new ShapeError("id must not be empty");
  }

  public get id(): string { return this.shapeId; }
  public get parent(): Group | null { return this.parentShape; }
  public setParent(parent: Group | null): void { this.parentShape = parent; }
  public abstract get type(): string;

  public move(dx: number, dy: number): void {
    this.requireFiniteNumber(dx, "dx");
    this.requireFiniteNumber(dy, "dy");
    this.moveGeometry(dx, dy);
  }

  public scale(factor: number): void {
    this.requireFiniteNumber(factor, "factor");
    if (factor <= 0) throw new ShapeError("scale factor must be positive");
    this.scaleGeometry(factor);
  }

  public setAttribute(attribute: string, value: string): void {
    if (attribute === "fill" || attribute === "stroke") {
      this.attributes.set(attribute, value);
      return;
    }
    if (attribute === "stroke-width") {
      const width = this.parseFiniteNumber(value, attribute);
      if (width < 0) throw new ShapeError("stroke-width must not be negative");
      this.attributes.set(attribute, this.formatNumber(width));
      return;
    }
    this.setGeometryAttribute(attribute, value);
  }

  public getAttribute(attribute: CommonAttribute): string | undefined {
    return this.attributes.get(attribute);
  }

  public getAttributeValue(attribute: string): string | undefined {
    if (attribute === "fill" || attribute === "stroke" || attribute === "stroke-width") return this.attributes.get(attribute);
    return this.geometryAttributeValue(attribute);
  }

  public restoreAttribute(attribute: string, value: string | undefined): void {
    if (attribute === "fill" || attribute === "stroke" || attribute === "stroke-width") {
      if (value === undefined) this.attributes.delete(attribute);
      else this.setAttribute(attribute, value);
      return;
    }
    if (value === undefined) throw new ShapeError(`cannot restore missing geometry attribute: ${attribute}`);
    this.setGeometryAttribute(attribute, value);
  }

  public abstract toSvg(): string;
  public abstract describe(): string;
  protected abstract moveGeometry(dx: number, dy: number): void;
  protected abstract scaleGeometry(factor: number): void;
  protected abstract setGeometryAttribute(attribute: string, value: string): void;
  protected abstract geometryAttributeValue(attribute: string): string | undefined;

  protected commonAttributes(): string {
    return [...this.attributes.entries()]
      .map(([name, value]) => ` ${name}="${Shape.escapeXml(value)}"`)
      .join("");
  }

  protected commonDescription(): string {
    return [...this.attributes.entries()]
      .map(([name, value]) => ` ${name}=${value}`)
      .join("");
  }

  protected parseFiniteNumber(value: string, attribute: string): number {
    const parsed = Number(value);
    this.requireFiniteNumber(parsed, attribute);
    return parsed;
  }

  protected requireFiniteNumber(value: number, name: string): void {
    if (!Number.isFinite(value)) throw new ShapeError(`${name} must be a finite number`);
  }

  public static escapeXml(value: string): string {
    return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;").replaceAll('"', "&quot;");
  }

  private formatNumber(value: number): string { return String(value); }
}
