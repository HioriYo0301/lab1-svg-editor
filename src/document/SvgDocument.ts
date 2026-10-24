import { Group } from "../shapes/Group.js";
import { Shape } from "../shapes/Shape.js";
import { DocumentError } from "./DocumentError.js";
import { ShapePlacement } from "./ShapePlacement.js";

export class SvgDocument implements Iterable<Shape> {
  private readonly rootShapes: Shape[] = [];
  private readonly shapesById = new Map<string, Shape>();

  public constructor(private canvasWidth = 800, private canvasHeight = 600) {
    this.validateDimension(canvasWidth, "width");
    this.validateDimension(canvasHeight, "height");
  }

  public get width(): number { return this.canvasWidth; }
  public get height(): number { return this.canvasHeight; }
  public get elementCount(): number { return this.shapesById.size; }
  public get rootCount(): number { return this.rootShapes.length; }

  public setCanvasSize(width: number, height: number): void {
    this.validateDimension(width, "width");
    this.validateDimension(height, "height");
    this.canvasWidth = width;
    this.canvasHeight = height;
  }

  public findById(id: string): Shape | undefined {
    return this.shapesById.get(id);
  }

  public requireById(id: string): Shape {
    const shape = this.findById(id);
    if (shape === undefined) throw new DocumentError(`no such shape: ${id}`);
    return shape;
  }

  public containsId(id: string): boolean {
    return this.shapesById.has(id);
  }

  public add(shape: Shape, parent: Group | null = null, index?: number): void {
    const subtree = this.collectSubtree(shape);
    this.ensureUniqueIds(subtree);

    if (parent === null) {
      if (shape.parent !== null) throw new DocumentError(`shape already has parent: ${shape.id}`);
      const insertionIndex = index ?? this.rootShapes.length;
      this.validateIndex(insertionIndex, this.rootShapes.length);
      this.rootShapes.splice(insertionIndex, 0, shape);
    } else {
      if (!this.shapesById.has(parent.id)) throw new DocumentError(`no such container: ${parent.id}`);
      const insertionIndex = index ?? parent.size;
      parent.addChild(shape, insertionIndex);
    }
    for (const item of subtree) this.shapesById.set(item.id, item);
  }

  public remove(shape: Shape): ShapePlacement {
    if (!this.shapesById.has(shape.id) || this.shapesById.get(shape.id) !== shape) {
      throw new DocumentError(`no such shape: ${shape.id}`);
    }
    const parent = shape.parent;
    const index = parent === null ? this.rootShapes.indexOf(shape) : parent.indexOf(shape);
    if (index < 0) throw new DocumentError(`shape is not attached: ${shape.id}`);

    if (parent === null) this.rootShapes.splice(index, 1);
    else parent.removeChild(shape);
    for (const item of this.collectSubtree(shape)) this.shapesById.delete(item.id);
    return { shape, parent, index };
  }

  public restore(placement: ShapePlacement): void {
    this.add(placement.shape, placement.parent, placement.index);
  }

  public [Symbol.iterator](): Iterator<Shape> {
    return this.rootShapes[Symbol.iterator]();
  }

  private collectSubtree(shape: Shape): Shape[] {
    const result: Shape[] = [shape];
    if (shape instanceof Group) {
      for (const child of shape) result.push(...this.collectSubtree(child));
    }
    return result;
  }

  private ensureUniqueIds(subtree: Shape[]): void {
    const localIds = new Set<string>();
    for (const shape of subtree) {
      if (localIds.has(shape.id) || this.shapesById.has(shape.id)) {
        throw new DocumentError(`id already exists: ${shape.id}`);
      }
      localIds.add(shape.id);
    }
  }

  private validateIndex(index: number, length: number): void {
    if (!Number.isInteger(index) || index < 0 || index > length) {
      throw new DocumentError("shape index out of range");
    }
  }

  private validateDimension(value: number, name: string): void {
    if (!Number.isFinite(value) || value <= 0) {
      throw new DocumentError(`canvas ${name} must be positive`);
    }
  }
}
