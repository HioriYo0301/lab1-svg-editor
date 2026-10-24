import { describe, expect, it } from "vitest";
import { CliApplication } from "../src/cli/CliApplication.js";

describe("structure commands", () => {
  it("groups same-level shapes and preserves their order", () => {
    const app = new CliApplication();
    app.handleLine("init");
    app.handleLine("create rect first 0 0 1 1");
    app.handleLine("create circle second 2 2 1");
    app.handleLine("create rect outside 3 3 1 1");

    expect(app.handleLine("group cluster second first")).toBe("g#cluster created with 2 children");
    expect(app.handleLine("tree")).toContain("└── rect#outside");
    expect(app.handleLine("tree cluster")).toContain("├── rect#first");
    expect(app.handleLine("tree cluster")).toContain("└── circle#second");
  });

  it("moves an existing shape into a group", () => {
    const app = new CliApplication();
    app.handleLine("init");
    app.handleLine("create g target");
    app.handleLine("create rect r1 0 0 10 10");

    expect(app.handleLine("addto target r1")).toBe("rect#r1 added to g#target");
    expect(app.handleLine("show r1")).toContain("parent=g#target");
  });

  it("ungroups a nested group into its parent", () => {
    const app = new CliApplication();
    app.handleLine("init");
    app.handleLine("create g outer");
    app.handleLine("create g inner in outer");
    app.handleLine("create rect r1 0 0 10 10 in inner");

    expect(app.handleLine("ungroup inner")).toBe("g#inner ungrouped (1 children)");
    expect(app.handleLine("show r1")).toContain("parent=g#outer");
    expect(app.handleLine("show inner")).toBe("error: no such shape: inner");
  });

  it("rejects invalid structural operations without changing state", () => {
    const app = new CliApplication();
    app.handleLine("init");
    app.handleLine("create g outer");
    app.handleLine("create g inner in outer");
    expect(app.handleLine("ungroup outer")).toBe("error: cannot ungroup top-level container: outer");
    expect(app.handleLine("addto inner outer")).toBe("error: cannot add a container into its own descendant");
    expect(app.handleLine("tree")).toContain("g#outer");
  });

  it("undoes and redoes grouping", () => {
    const app = new CliApplication();
    app.handleLine("init");
    app.handleLine("create rect r1 0 0 1 1");
    app.handleLine("create rect r2 0 0 1 1");
    app.handleLine("group cluster r1 r2");
    expect(app.handleLine("undo")).toContain("g#cluster removed");
    expect(app.handleLine("show r1")).toContain("parent=svg");
    expect(app.handleLine("redo")).toContain("g#cluster created");
    expect(app.handleLine("show r1")).toContain("parent=g#cluster");
  });

  it("undoes deletion and restores a complete subtree", () => {
    const app = new CliApplication();
    app.handleLine("init");
    app.handleLine("create g node");
    app.handleLine("create rect r1 0 0 10 10 in node");
    app.handleLine("delete node");
    expect(app.handleLine("undo")).toContain("g#node restored");
    expect(app.handleLine("show r1")).toContain("parent=g#node");
    app.handleLine("redo");
    expect(app.handleLine("show r1")).toBe("error: no such shape: r1");
  });

  it("undoes addto and ungroup", () => {
    const app = new CliApplication();
    app.handleLine("init");
    app.handleLine("create g target");
    app.handleLine("create rect r1 0 0 10 10");
    app.handleLine("addto target r1");
    app.handleLine("undo");
    expect(app.handleLine("show r1")).toContain("parent=svg");
    app.handleLine("redo");
    expect(app.handleLine("show r1")).toContain("parent=g#target");

    app.handleLine("create g outer");
    app.handleLine("create g inner in outer");
    app.handleLine("create rect nested 0 0 1 1 in inner");
    app.handleLine("ungroup inner");
    app.handleLine("undo");
    expect(app.handleLine("show nested")).toContain("parent=g#inner");
    expect(app.handleLine("redo")).toContain("ungrouped");
  });
});
