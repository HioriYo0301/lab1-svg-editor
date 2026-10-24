import { XMLParser } from "fast-xml-parser";
import { SvgDocument } from "../document/SvgDocument.js";
import { ShapeFactory } from "../shapes/ShapeFactory.js";
import { Shape } from "../shapes/Shape.js";
import { Group } from "../shapes/Group.js";
import { ShapeError } from "../shapes/ShapeError.js";

interface XmlNode {
  [name: string]: unknown;
}

export interface SvgReadResult {
  readonly document: SvgDocument;
  readonly warnings: readonly string[];
}

export class SvgReader {
  private readonly parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
    textNodeName: "#text",
    preserveOrder: true,
    removeNSPrefix: true,
    trimValues: false,
  });

  public constructor(private readonly factory = new ShapeFactory()) {}

  public read(content: string): SvgReadResult {
    const parsed = this.parser.parse(content) as XmlNode[];
    const svgNode = parsed.find((node) => Object.prototype.hasOwnProperty.call(node, "svg"));
    if (svgNode === undefined) throw new ShapeError("root element must be svg");
    const svgChildren = this.asNodes(svgNode.svg);
    const attributes = this.attributes(svgNode);
    const document = new SvgDocument(this.dimension(attributes["width"], 800), this.dimension(attributes["height"], 600));
    const warnings: string[] = [];
    const counters = new Map<string, number>();
    const usedIds = new Set<string>();
    for (const child of svgChildren) {
      const shape = this.parseShape(child, counters, warnings, usedIds);
      if (shape !== null) document.add(shape);
    }
    return { document, warnings };
  }

  private parseShape(node: XmlNode, counters: Map<string, number>, warnings: string[], usedIds: Set<string>): Shape | null {
    const type = this.elementName(node);
    if (type === null || type === "#text" || type === "#comment") return null;
    const attributes = this.attributes(node);
    const id = attributes["id"] ?? this.generateId(type, counters, usedIds);
    if (attributes["id"] === undefined) warnings.push(`warning: assigned id ${id} to unnamed <${type}>`);
    if (usedIds.has(id)) throw new ShapeError(`id already exists: ${id}`);
    usedIds.add(id);
    const children = this.asNodes(node[type]);
    const parameters = this.parameters(type, attributes, children);
    const shape = this.factory.create(type, id, parameters);
    for (const attribute of ["fill", "stroke", "stroke-width"] as const) {
      if (attributes[attribute] !== undefined) shape.setAttribute(attribute, attributes[attribute]);
    }
    if (shape instanceof Group) {
      for (const childNode of children) {
        const child = this.parseShape(childNode, counters, warnings, usedIds);
        if (child !== null) shape.addChild(child);
      }
    }
    return shape;
  }

  private parameters(type: string, attributes: Record<string, string>, children: XmlNode[]): string[] {
    const value = (name: string): string => attributes[name] ?? "";
    switch (type) {
      case "rect": return [value("x"), value("y"), value("width"), value("height")];
      case "circle": return [value("cx"), value("cy"), value("r")];
      case "ellipse": return [value("cx"), value("cy"), value("rx"), value("ry")];
      case "line": return [value("x1"), value("y1"), value("x2"), value("y2")];
      case "text": return [value("x"), value("y"), children.filter((child) => child["#text"] !== undefined).map((child) => String(child["#text"])).join("")];
      case "g": return [];
      default: throw new ShapeError(`unknown shape type: ${type} (is the plugin loaded?)`);
    }
  }

  private elementName(node: XmlNode): string | null {
    return Object.keys(node).find((key) => key !== ":@") ?? null;
  }

  private attributes(node: XmlNode): Record<string, string> {
    const raw = node[":@"] as Record<string, string> | undefined;
    if (raw === undefined) return {};
    return Object.fromEntries(Object.entries(raw).map(([key, value]) => [key.replace(/^@_/, ""), value]));
  }

  private asNodes(value: unknown): XmlNode[] {
    return Array.isArray(value) ? value as XmlNode[] : [];
  }

  private generateId(type: string, counters: Map<string, number>, usedIds: Set<string>): string {
    let next = (counters.get(type) ?? 0) + 1;
    let id = `${type}${next}`;
    while (usedIds.has(id)) { next += 1; id = `${type}${next}`; }
    counters.set(type, next);
    return id;
  }

  private dimension(value: string | undefined, fallback: number): number {
    if (value === undefined || value === "") return fallback;
    const parsed = Number(value.replace(/px$/, ""));
    if (!Number.isFinite(parsed) || parsed <= 0) throw new ShapeError("canvas dimensions must be positive");
    return parsed;
  }
}
