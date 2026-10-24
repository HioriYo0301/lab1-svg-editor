export class ShapeError extends Error {
  public constructor(message: string) {
    super(message);
    this.name = "ShapeError";
  }
}
