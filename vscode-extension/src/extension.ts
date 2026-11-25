import * as vscode from "vscode";
import { SvgDocumentSymbolProvider } from "./svgDocumentSymbolProvider";
import { SvgFileDecorationProvider } from "./svgFileDecorationProvider";

export function activate(context: vscode.ExtensionContext): void {
  context.subscriptions.push(
    vscode.window.registerFileDecorationProvider(new SvgFileDecorationProvider()),
    vscode.languages.registerDocumentSymbolProvider([
      { language: "svg" },
      { scheme: "file", pattern: "**/*.svg" },
    ], new SvgDocumentSymbolProvider()),
  );
}

export function deactivate(): void { /* VS Code owns provider disposal through subscriptions. */ }
