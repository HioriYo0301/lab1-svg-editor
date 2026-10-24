import { describe, expect, it } from "vitest";
import { CliApplication } from "../src/cli/CliApplication.js";

describe("basic CLI application", () => {
  it("creates a document and displays its tree", () => {
    const app = new CliApplication();
    expect(app.handleLine("init 800 600")).toBe("canvas 800x600 created");
    expect(app.handleLine("create rect bg 0 0 800 600 #ffffff")).toBe("rect#bg created");
    expect(app.handleLine('create text title 20 40 "My Diagram"')).toBe("text#title created");
    expect(app.handleLine("create g scene")).toBe("g#scene created");
    expect(app.handleLine("create circle c1 100 100 20 red in scene")).toBe("circle#c1 created in g#scene");

    expect(app.handleLine("tree")).toContain("svg (800x600)");
    expect(app.handleLine("tree")).toContain("circle#c1 cx=100 cy=100 r=20");
    expect(app.handleLine("show c1")).toContain("parent=g#scene");
  });

  it("supports canvas queries and resizing", () => {
    const app = new CliApplication();
    app.handleLine("init");
    expect(app.handleLine("canvas")).toBe("canvas 800x600");
    expect(app.handleLine("canvas 400 300")).toBe("canvas resized to 400x300");
    expect(app.handleLine("canvas")).toBe("canvas 400x300");
  });

  it("reports errors without changing state", () => {
    const app = new CliApplication();
    expect(app.handleLine("create rect r1 0 0 10 10")).toBe("error: no document. use 'init' or 'read' first");
    app.handleLine("init");
    expect(app.handleLine("create hexagon h1")).toContain("error: unknown shape type: hexagon");
    expect(app.handleLine("tree")).toBe("svg (800x600)");
  });
});
