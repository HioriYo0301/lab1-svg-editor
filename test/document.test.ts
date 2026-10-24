import { describe, expect, it } from "vitest";
import { SvgDocument } from "../src/document/SvgDocument.js";
import { DocumentError } from "../src/document/DocumentError.js";
import { Group } from "../src/shapes/Group.js";
import { Rect } from "../src/shapes/Rect.js";
import { Circle } from "../src/shapes/Circle.js";

describe("SvgDocument", () => {
  it("stores canvas dimensions and root shapes", () => {
    const document = new SvgDocument(400, 300);
    document.add(new Rect("r1", 0, 0, 10, 20));

    expect(document.width).toBe(400);
    expect(document.height).toBe(300);
    expect(document.rootCount).toBe(1);
    expect(document.elementCount).toBe(1);
    expect([...document].map((shape) => shape.id)).toEqual(["r1"]);
  });

  it("indexes nested shapes by id", () => {
    const document = new SvgDocument();
    const group = new Group("g1");
    const rect = new Rect("r1", 0, 0, 10, 20);
    group.addChild(rect);
    document.add(group);

    expect(document.findById("g1")).toBe(group);
    expect(document.findById("r1")).toBe(rect);
    expect(document.elementCount).toBe(2);
  });

  it("rejects duplicate ids without changing the document", () => {
    const document = new SvgDocument();
    const original = new Rect("r1", 0, 0, 10, 20);
    document.add(original);

    expect(() => document.add(new Circle("r1", 1, 1, 1))).toThrow("id already exists: r1");
    expect(document.elementCount).toBe(1);
    expect([...document].map((shape) => shape.id)).toEqual(["r1"]);
  });

  it("removes and restores a complete subtree", () => {
    const document = new SvgDocument();
    const group = new Group("g1");
    const rect = new Rect("r1", 0, 0, 10, 20);
    group.addChild(rect);
    document.add(group);

    const placement = document.remove(group);
    expect(document.elementCount).toBe(0);
    expect(document.findById("r1")).toBeUndefined();
    expect(rect.parent).toBe(group);

    document.restore(placement);
    expect(document.elementCount).toBe(2);
    expect(document.findById("r1")).toBe(rect);
    expect([...document].map((shape) => shape.id)).toEqual(["g1"]);
  });

  it("adds a child through the document and preserves root order", () => {
    const document = new SvgDocument();
    const group = new Group("g1");
    const first = new Rect("r1", 0, 0, 1, 1);
    const second = new Rect("r2", 0, 0, 1, 1);
    document.add(group);
    document.add(first, group);
    document.add(second, group, 0);

    expect([...group].map((shape) => shape.id)).toEqual(["r2", "r1"]);
  });

  it("validates dimensions and missing shapes", () => {
    expect(() => new SvgDocument(0, 100)).toThrow("canvas width must be positive");
    const document = new SvgDocument();
    expect(() => document.requireById("missing")).toThrow(new DocumentError("no such shape: missing"));
  });
});
