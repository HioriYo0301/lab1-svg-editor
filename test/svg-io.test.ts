import { describe, expect, it } from "vitest";
import { CliApplication } from "../src/cli/CliApplication.js";
import { FileSystem } from "../src/io/FileSystem.js";

class MemoryFileSystem implements FileSystem {
  public readonly files = new Map<string, string>();
  public readFile(path: string): string {
    const value = this.files.get(path);
    if (value === undefined) throw new Error("missing");
    return value;
  }
  public writeFile(path: string, content: string): void { this.files.set(path, content); }
}

describe("SVG IO", () => {
  it("round-trips a document through SVG", () => {
    const fs = new MemoryFileSystem();
    const app = new CliApplication(fs);
    app.handleLine("init 400 200");
    app.handleLine("create g flow");
    app.handleLine("create rect start 10 20 100 50 #4a90d9 in flow");
    app.handleLine('create text label 20 40 "Hello SVG" in flow');
    expect(app.handleLine("save demo.svg")).toBe("saved to demo.svg (3 elements)");

    const loaded = new CliApplication(fs);
    expect(loaded.handleLine("read demo.svg")).toBe("read demo.svg (3 elements)");
    expect(loaded.handleLine("tree")).toContain("rect#start x=10 y=20 w=100 h=50 fill=#4a90d9");
    expect(loaded.handleLine("show label")).toContain('"Hello SVG"');
  });

  it("assigns ids and warns for unnamed SVG elements", () => {
    const fs = new MemoryFileSystem();
    fs.files.set("input.svg", '<svg width="100" height="80"><rect x="0" y="0" width="10" height="10"/><g><circle cx="2" cy="3" r="1"/></g></svg>');
    const app = new CliApplication(fs);
    const output = app.handleLine("read input.svg") ?? "";
    expect(output).toContain("warning: assigned id rect1 to unnamed <rect>");
    expect(output).toContain("warning: assigned id g1 to unnamed <g>");
    expect(output).toContain("warning: assigned id circle1 to unnamed <circle>");
    expect(app.handleLine("tree")).toContain("rect#rect1");
  });

  it("keeps the current document when read or save fails", () => {
    const fs = new MemoryFileSystem();
    const app = new CliApplication(fs);
    app.handleLine("init 100 80");
    expect(app.handleLine("read missing.svg")).toBe("error: cannot read file: missing.svg");
    expect(app.handleLine("tree")).toBe("svg (100x80)");
    expect(app.handleLine("save")).toBe("error: cannot write file: no path specified");
  });
});
