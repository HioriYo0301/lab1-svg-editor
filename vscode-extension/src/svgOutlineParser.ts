import { parser } from "sax";

export interface SvgOutlineNode {
  readonly name: string;
  readonly id?: string;
  readonly start: number;
  readonly startTagEnd: number;
  end: number;
  readonly children: SvgOutlineNode[];
}

/** Source offsets are UTF-16 offsets, matching TextDocument.positionAt. */
export class SvgOutlineParser {
  public parse(source: string): readonly SvgOutlineNode[] {
    const roots: SvgOutlineNode[] = [];
    const stack: SvgOutlineNode[] = [];
    const xml = parser(true, { position: true, xmlns: false });
    let invalid = false;
    xml.onerror = () => { invalid = true; };
    xml.onopentag = (tag) => {
      const id = tag.attributes.id;
      const node: SvgOutlineNode = {
        name: tag.name,
        ...(typeof id === "string" ? { id } : {}),
        start: xml.startTagPosition - 1,
        startTagEnd: xml.position,
        end: xml.position,
        children: [],
      };
      const parent = stack[stack.length - 1];
      if (parent) parent.children.push(node);
      else roots.push(node);
      stack.push(node);
    };
    xml.onclosetag = () => {
      const node = stack.pop();
      if (node) node.end = xml.position;
    };
    // SAX performs no IO and never resolves external entities.
    try {
      xml.write(source).close();
      if (invalid || stack.length !== 0 || roots.length !== 1 || roots[0]?.name.split(":").pop() !== "svg") return [];
      return roots;
    } catch {
      return []; // Partially typed XML is normal while editing.
    }
  }
}
