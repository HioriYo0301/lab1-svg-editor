import * as vscode from "vscode";

export class SvgFileDecorationProvider implements vscode.FileDecorationProvider {
  public async provideFileDecoration(uri: vscode.Uri): Promise<vscode.FileDecoration | undefined> {
    if (uri.scheme !== "file" || uri.path.toLowerCase().endsWith(".svg") === false) return undefined;
    try {
      const stat = await vscode.workspace.fs.stat(uri);
      if ((stat.type & vscode.FileType.File) === 0) return undefined;
      return { badge: "[]", tooltip: "SVG file", propagate: false };
    } catch {
      return undefined;
    }
  }
}
