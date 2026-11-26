export interface AttributeHandler {
  readonly name: string;
  handles(shapeId: string, attribute: string): boolean;
  apply(shapeId: string, attribute: string, value: string): void;
}
