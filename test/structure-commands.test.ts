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
});
