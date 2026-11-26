import { describe, expect, it } from "vitest";
import { CliApplication } from "../src/cli/CliApplication.js";
import { BoxShapeProvider, BoxAttributeHandler } from "../src/plugins/BoxPlugin.js";
import { BoxTypeDecorator } from "../src/plugins/BoxTypeDecorator.js";
import { ModifiedStarDecorator } from "../src/plugins/ModifiedStarDecorator.js";
import { NodeFileSystem } from "../src/io/NodeFileSystem.js";

function boxApp(): CliApplication {
  const app = new CliApplication(new NodeFileSystem(), undefined, undefined, []);
  app.registerShapeProvider(new BoxShapeProvider());
  app.extensions.registerAttribute(new BoxAttributeHandler());
  app.registerTreeDecorator(new BoxTypeDecorator());
  return app;
}

describe("box plugin and tree decorators", () => {
  it("creates, edits, moves, serializes and undoes a box as one shape", () => {
    const app = boxApp();
    expect(app.handleLine("init 800 600")).toContain("created");
    expect(app.handleLine('create box n1 120 100 160 60 "开始"')).toContain("box#n1 created");
    expect(app.handleLine("set n1 fill #f5a623")).toContain("updated");
    expect(app.handleLine('set n1 label "处理数据 v2"')).toContain("updated");
    expect(app.handleLine("tree")).toContain("g#n1 (box)");
    expect(app.currentDocument?.findById("n1-rect")?.getAttribute("fill")).toBe("#f5a623");
    expect(app.currentDocument?.findById("n1-label")?.getAttributeValue("text")).toBe("处理数据 v2");
    expect(app.handleLine("undo")).toContain("restored");
    expect(app.currentDocument?.findById("n1-label")?.getAttributeValue("text")).toBe("开始");
    expect(app.handleLine("redo")).toContain("updated");
    const xml = app.handleLine("save box.svg");
    expect(xml).toContain("saved");
    expect(app.handleLine("read box.svg")).toContain("read");
    expect(app.currentDocument?.findById("n1")?.type).toBe("box");
    const withoutPlugin = new CliApplication(new NodeFileSystem(), undefined, undefined, []);
    expect(withoutPlugin.handleLine("read box.svg")).toContain("read");
    expect(withoutPlugin.currentDocument?.findById("n1")?.type).toBe("g");
  });

  it("adds independent box and modified labels", () => {
    const app = boxApp();
    const stars = new ModifiedStarDecorator(); app.registerTreeDecorator(stars);
    app.handleLine("init"); app.handleLine('create box n1 0 0 10 10 "x"');
    app.handleLine("move n1 1 1");
    expect(app.handleLine("tree")).toContain("(box) *");
    app.handleLine("save decorated.svg");
    expect(app.handleLine("tree")).not.toContain("*");
    app.handleLine("move n1 2 0");
    expect(app.handleLine("tree")).toContain("*");
    app.handleLine("undo");
    expect(app.handleLine("tree")).not.toContain("*");
  });
});
