import { describe, expect, it } from "vitest";
import { Circle } from "../src/shapes/Circle.js";
import { Ellipse } from "../src/shapes/Ellipse.js";
import { Line } from "../src/shapes/Line.js";
import { Rect } from "../src/shapes/Rect.js";
import { Text } from "../src/shapes/Text.js";

describe("shape hierarchy", () => {
  it("moves and scales a rectangle", () => {
    const rect = new Rect("r1", 10, 20, 100, 50);
    rect.move(5, -2);
    rect.scale(2);
    expect(rect.x).toBe(30);
    expect(rect.y).toBe(36);
    expect(rect.width).toBe(200);
    expect(rect.height).toBe(100);
  });

  it("supports all primitive shape types", () => {
    expect(new Circle("c1", 10, 20, 5).type).toBe("circle");
    expect(new Ellipse("e1", 10, 20, 5, 8).type).toBe("ellipse");
    expect(new Line("l1", 0, 1, 2, 3).type).toBe("line");
    expect(new Text("t1", 10, 20, "hello").type).toBe("text");
  });

  it("serializes common attributes and escapes text", () => {
    const text = new Text("t1", 10, 20, "A < B & C");
    text.setAttribute("fill", "red");
    text.setAttribute("stroke-width", "2");
    expect(text.toSvg()).toContain('fill="red"');
    expect(text.toSvg()).toContain("A &lt; B &amp; C");
  });

  it("supports type-specific attributes", () => {
    const circle = new Circle("c1", 10, 20, 5);
    circle.setAttribute("cx", "30");
    circle.setAttribute("r", "8");
    expect(circle.cx).toBe(30);
    expect(circle.r).toBe(8);

    const text = new Text("t1", 0, 0, "old");
    text.setAttribute("text", "new value");
    expect(text.text).toBe("new value");
  });

  it("rejects invalid scale factors and attributes", () => {
    const rect = new Rect("r1", 0, 0, 10, 10);
    expect(() => rect.scale(0)).toThrow("scale factor must be positive");
    expect(() => rect.setAttribute("unknown", "1")).toThrow("unknown attribute: unknown");
    expect(() => rect.setAttribute("width", "-1")).toThrow("width must not be negative");
  });

  it("does not mutate geometry when an attribute update fails", () => {
    const rect = new Rect("r1", 0, 0, 10, 10);
    expect(() => rect.setAttribute("width", "invalid")).toThrow();
    expect(rect.width).toBe(10);
  });
});
