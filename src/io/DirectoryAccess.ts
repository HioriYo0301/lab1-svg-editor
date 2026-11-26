export interface DirectoryEntry {
  readonly name: string;
  readonly kind: "directory" | "file" | "other";
}

export interface DirectoryAccess {
  list(path: string): readonly DirectoryEntry[];
}
