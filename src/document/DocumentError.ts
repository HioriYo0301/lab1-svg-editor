export class DocumentError extends Error {
  public constructor(message: string) {
    super(message);
    this.name = "DocumentError";
  }
}
