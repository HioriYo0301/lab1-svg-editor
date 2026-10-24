import { describe, expect, it } from "vitest";
import { Circle } from "../src/shapes/Circle.js";
import { Group } from "../src/shapes/Group.js";
import { Rect } from "../src/shapes/Rect.js";

describe("Group composite", () => {
  it("keeps children ordered and sets their parent", () => {
    const group = new Group("g1");
    const first = new Rect("r1", 0, 0, 10, 10);
    const second = new Circle("c1", 20, 20, 5);
    group.addChild(first);
    group.addChild(second, 0);

    expect([...group].map((shape) => shape.id)).toEqual(["c1", "r1"]);
    expect(first.parent).toBe(group);
    expect(group.size).toBe(2);
  });

  it("moves and scales every descendant", () => {
    const group = new Group("g1");
    const rect = new Rect("r1", 10, 20, 30, 40);
    group.addChild(rect);

    group.move(5, -2);
    group.scale(2);

    expect(rect.x).toBe(30);
    expect(rect.y).toBe(36);
    expect(rect.width).toBe(60);
    expect(rect.height).toBe(80);
  });

  it("serializes nested children as one SVG group", () => {
    const group = new Group("g1");
    group.setAttribute("fill", "blue");
    group.addChild(new Rect("r1", 0, 0, 10, 20));

    expect(group.toSvg()).toBe('<g id="g1" fill="blue"><rect id="r1" x="0" y="0" width="10" height="20"/></g>');
  });

  it("removes a child and clears its parent", () => {
    const group = new Group("g1");
    const rect = new Rect("r1", 0, 0, 10, 10);
    group.addChild(rect);
    expect(group.removeChild(rect)).toBe(0);
    expect(rect.parent).toBeNull();
    expect(group.size).toBe(0);
  });

  it("rejects self and ancestor cycles", () => {
    const outer = new Group("outer");
    const inner = new Group("inner");
    outer.addChild(inner);

    expect(() => outer.addChild(outer)).toThrow("cannot add group to itself");
    expect(() => inner.addChild(outer)).toThrow("cannot add a group to its descendant");
  });

  it("rejects attaching a child that already has a parent", () => {
    const first = new Group("g1");
    const second = new Group("g2");
    const rect = new Rect("r1", 0, 0, 10, 10);
    first.addChild(rect);

    expect(() => second.addChild(rect)).toThrow("shape already has parent: r1");
  });
});
