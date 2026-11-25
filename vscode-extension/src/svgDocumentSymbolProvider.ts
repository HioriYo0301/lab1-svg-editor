import * as vscode from "vscode";
import { SvgOutlineParser, SvgOutlineNode } from "./svgOutlineParser";

export class SvgDocumentSymbolProvider implements vscode.DocumentSymbolProvider {
  private readonly parser = new SvgOutlineParser();
  public provideDocumentSymbols(document: vscode.TextDocument): vscode.ProviderResult<vscode.DocumentSymbol[]> {
    try {
      return this.parser.parse(document.getText()).map((node) => this.toSymbol(document, node));
    } catch {
      return [];
    }
  }

  private toSymbol(document: vscode.TextDocument, node: SvgOutlineNode): vscode.DocumentSymbol {
    const start = document.positionAt(node.start);
    const end = document.positionAt(Math.max(node.end, node.startTagEnd));
    const range = new vscode.Range(start, end);
    const selection = new vscode.Range(start, document.positionAt(node.startTagEnd));
    const label = node.id ? `${node.name}#${node.id}` : node.name;
    const symbol = new vscode.DocumentSymbol(label, `<${node.name}>`, vscode.SymbolKind.Struct, range, selection);
    symbol.children.push(...node.children.map((child) => this.toSymbol(document, child)));
    return symbol;
  }
}
