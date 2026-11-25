import { describe, expect, it } from "vitest";
import { SvgOutlineParser } from "../src/svgOutlineParser";

const parseSvgOutline = (source: string) => new SvgOutlineParser().parse(source);

describe("SVG outline parser", () => {
  it("preserves nested elements and ids", () => {
    const nodes = parseSvgOutline('<svg><g id="flow"><rect id="start"/><text>hello</text></g></svg>');
    expect(nodes[0]?.name).toBe("svg");
    expect(nodes[0]?.children[0]?.name).toBe("g");
    expect(nodes[0]?.children[0]?.id).toBe("flow");
    expect(nodes[0]?.children[0]?.children.map((child) => child.name)).toEqual(["rect", "text"]);
  });

  it("supports unquoted-free elements without ids", () => {
    const nodes = parseSvgOutline("<svg><text x='1' y='2'>label</text></svg>");
    expect(nodes[0]?.children[0]?.id).toBeUndefined();
    expect(nodes[0]?.children[0]?.name).toBe("text");
  });

  it("clears incomplete XML safely", () => {
    const source = "<svg><g id='open'><rect";
    const nodes = parseSvgOutline(source);
    expect(nodes).toEqual([]);
  });

  it("preserves siblings after explicit leaf closing tags", () => {
    const [root] = parseSvgOutline('<svg><g><rect></rect><text>hello</text></g><circle/></svg>');
    expect(root!.children.map((node) => node.name)).toEqual(["g", "circle"]);
    expect(root!.children[0]!.children.map((node) => node.name)).toEqual(["rect", "text"]);
  });
  it("computes UTF-16 source ranges including CRLF and emoji", () => {
    const source = '<svg>\r\n<!-- 开始😀 --><rect id="r"/>\r\n<text>中文</text></svg>';
    const [root] = parseSvgOutline(source);
    const rect = root!.children[0]!;
    expect(source.slice(rect.start, rect.end)).toBe('<rect id="r"/>');
    expect(rect.startTagEnd).toBe(rect.end);
    expect(source.slice(root!.start, root!.end)).toBe(source);
  });
  it("handles quoted delimiters, decoded ids, comments and CDATA", () => {
    const [root] = parseSvgOutline('<svg><!-- <g/> --><text id="a&amp;b" data-x="a > b"><![CDATA[<rect/>]]></text></svg>');
    expect(root!.children).toHaveLength(1);
    expect(root!.children[0]!.id).toBe("a&b");
    expect(root!.children[0]!.children).toEqual([]);
  });
  it.each(['<svg><g></svg>', '<svg><rect id="bad></svg>', '<svg/><svg/>', '<svg>&unknown;</svg>', ''])('clears malformed XML: %s', (source) => {
    expect(parseSvgOutline(source)).toEqual([]);
  });

  it("updates results when source changes", () => {
    expect(parseSvgOutline("<svg><rect id='one'/></svg>")[0]?.children[0]?.id).toBe("one");
    expect(parseSvgOutline("<svg><circle id='two'/></svg>")[0]?.children[0]?.name).toBe("circle");
  });
});
