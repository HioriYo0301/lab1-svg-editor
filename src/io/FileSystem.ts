export interface FileSystem {
  readFile(path: string): string;
  writeFile(path: string, content: string): void;
}
