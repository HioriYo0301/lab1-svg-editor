import { Shape } from "./Shape.js";
import { ShapeError } from "./ShapeError.js";

export class Group extends Shape implements Iterable<Shape> {
  private readonly childShapes: Shape[] = [];

  public constructor(id: string) {
    super(id);
  }

  public get type(): string { return "g"; }
  public get size(): number { return this.childShapes.length; }

  public addChild(child: Shape, index = this.childShapes.length): void {
    if (child === this) throw new ShapeError("cannot add group to itself");
    if (child.parent !== null) throw new ShapeError(`shape already has parent: ${child.id}`);
    if (this.isDescendantOf(child)) {
      throw new ShapeError("cannot add a group to its descendant");
    }
    if (!Number.isInteger(index) || index < 0 || index > this.childShapes.length) {
      throw new ShapeError("child index out of range");
    }
    this.childShapes.splice(index, 0, child);
    child.setParent(this);
  }

  public removeChild(child: Shape): number {
    const index = this.childShapes.indexOf(child);
    if (index < 0) throw new ShapeError(`child is not in group: ${child.id}`);
    this.childShapes.splice(index, 1);
    child.setParent(null);
    return index;
  }

  public childAt(index: number): Shape {
    const child = this.childShapes[index];
    if (child === undefined) throw new ShapeError(`child index out of range: ${index}`);
    return child;
  }

  public indexOf(child: Shape): number {
    return this.childShapes.indexOf(child);
  }

  public [Symbol.iterator](): Iterator<Shape> {
    return this.childShapes[Symbol.iterator]();
  }

  public toSvg(): string {
    const children = this.childShapes.map((child) => child.toSvg()).join("");
    return `<g id="${Shape.escapeXml(this.id)}"${this.commonAttributes()}>${children}</g>`;
  }

  public describe(): string { return `g#${this.id}${this.commonDescription()}`; }

  protected moveGeometry(dx: number, dy: number): void {
    for (const child of this.childShapes) child.move(dx, dy);
  }

  protected scaleGeometry(factor: number): void {
    for (const child of this.childShapes) child.scale(factor);
  }

  protected setGeometryAttribute(attribute: string, _value: string): void {
    throw new ShapeError(`unknown attribute: ${attribute}`);
  }

  protected geometryAttributeValue(_attribute: string): string | undefined { return undefined; }

  private isDescendantOf(candidate: Shape): boolean {
    let current: Shape | null = this;
    while (current !== null) {
      if (current === candidate) return true;
      current = current.parent;
    }
    return false;
  }
}
