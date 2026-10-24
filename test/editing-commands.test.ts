import { describe, expect, it } from "vitest";
import { CliApplication } from "../src/cli/CliApplication.js";

describe("editing commands", () => {
  it("moves and scales a group recursively", () => {
    const app = new CliApplication();
    app.handleLine("init 800 600");
    app.handleLine("create g node");
    app.handleLine("create rect r1 10 20 30 40 in node");

    expect(app.handleLine("move node 5 -2")).toBe("g#node moved by (5,-2)");
    expect(app.handleLine("scale node 2")).toBe("g#node scaled by 2");
    expect(app.handleLine("show r1")).toContain("x=30 y=36 w=60 h=80");
  });

  it("sets attributes and rejects unknown attributes", () => {
    const app = new CliApplication();
    app.handleLine("init");
    app.handleLine("create rect r1 0 0 10 10");
    expect(app.handleLine("set r1 fill blue")).toBe("rect#r1 updated: fill=blue");
    expect(app.handleLine("set r1 unsupported value")).toBe("error: unknown attribute: unsupported");
    expect(app.handleLine("show r1")).toContain("fill=blue");
  });

  it("deletes a subtree", () => {
    const app = new CliApplication();
    app.handleLine("init");
    app.handleLine("create g node");
    app.handleLine("create rect r1 0 0 10 10 in node");
    expect(app.handleLine("delete node")).toBe("g#node deleted");
    expect(app.handleLine("tree")).toBe("svg (800x600)");
  });

  it("changes z-order only among siblings", () => {
    const app = new CliApplication();
    app.handleLine("init");
    app.handleLine("create rect first 0 0 1 1");
    app.handleLine("create rect second 0 0 1 1");
    expect(app.handleLine("back second")).toBe("rect#second moved to back");
    expect(app.handleLine("tree")).toContain("└── rect#first");
    expect(app.handleLine("front first")).toBe("rect#first moved to front");
    expect(app.handleLine("tree")).toContain("└── rect#first");
  });

  it("does not edit when a command has invalid numeric input", () => {
    const app = new CliApplication();
    app.handleLine("init");
    app.handleLine("create rect r1 0 0 10 10");
    expect(app.handleLine("move r1 invalid 1")).toBe("error: dx must be a finite number");
    expect(app.handleLine("show r1")).toContain("x=0 y=0");
  });

  it("supports undo and redo for editing commands", () => {
    const app = new CliApplication();
    app.handleLine("init");
    app.handleLine("create rect r1 0 0 10 10");
    app.handleLine("move r1 30 0");
    expect(app.handleLine("undo")).toContain("moved back");
    expect(app.handleLine("show r1")).toContain("x=0 y=0");
    expect(app.handleLine("redo")).toContain("moved by (30,0)");
    expect(app.handleLine("show r1")).toContain("x=30 y=0");
  });

  it("clears redo after a new edit", () => {
    const app = new CliApplication();
    app.handleLine("init");
    app.handleLine("create rect r1 0 0 10 10");
    app.handleLine("move r1 10 0");
    app.handleLine("undo");
    app.handleLine("move r1 20 0");
    expect(app.handleLine("redo")).toBe("error: nothing to redo");
  });

  it("blocks history after an IO-style document command", () => {
    const app = new CliApplication();
    app.handleLine("init");
    app.handleLine("create rect r1 0 0 10 10");
    app.handleLine("canvas 400 300");
    expect(app.handleLine("undo")).toBe("error: undo not allowed after io command");
    app.handleLine("move r1 1 0");
    expect(app.handleLine("undo")).toContain("moved back");
  });
});
