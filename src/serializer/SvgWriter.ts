import { SvgDocument } from "../document/SvgDocument.js";

export class SvgWriter {
  public write(document: SvgDocument): string {
    const body = [...document].map((shape) => shape.toSvg()).join("");
    return `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" width="${document.width}" height="${document.height}" viewBox="0 0 ${document.width} ${document.height}">${body}</svg>\n`;
  }
}
