import { SvgDocument } from "../document/SvgDocument.js";
import { Group } from "../shapes/Group.js";
import { Shape } from "../shapes/Shape.js";
import { Command } from "./Command.js";
import { CommandError } from "./CommandError.js";

export class GroupCommand implements Command {
  public constructor(private readonly document: SvgDocument, private readonly groupId: string, private readonly memberIds: readonly string[]) {}

  public execute(): string {
    if (this.document.containsId(this.groupId)) throw new CommandError(`id already exists: ${this.groupId}`);
    if (this.memberIds.length === 0) throw new CommandError("group requires at least one shape");
    const members = this.resolveMembers();
    const parent = members[0].parent;
    if (members.some((member) => member.parent !== parent)) throw new CommandError("cannot group shapes with different parents");
    if (members.some((member, index) => members.some((other, otherIndex) => index !== otherIndex && this.isAncestor(member, other)))) {
      throw new CommandError("cannot group a container into its own descendant");
    }

    const ordered = [...members].sort((left, right) => this.siblingIndex(left) - this.siblingIndex(right));
    const insertionIndex = Math.min(...ordered.map((member) => this.siblingIndex(member)));
    for (const member of [...ordered].reverse()) this.document.remove(member);

    const group = new Group(this.groupId);
    for (const member of ordered) group.addChild(member);
    this.document.add(group, parent, insertionIndex);
    return `g#${group.id} created with ${ordered.length} children`;
  }

  private resolveMembers(): Shape[] {
    const seen = new Set<string>();
    return this.memberIds.map((id) => {
      if (seen.has(id)) throw new CommandError(`duplicate group member: ${id}`);
      seen.add(id);
      return this.document.requireById(id);
    });
  }

  private siblingIndex(shape: Shape): number {
    return shape.parent === null ? [...this.document].indexOf(shape) : shape.parent.indexOf(shape);
  }

  private isAncestor(ancestor: Shape, descendant: Shape): boolean {
    let current = descendant.parent;
    while (current !== null) {
      if (current === ancestor) return true;
      current = current.parent;
    }
    return false;
  }
}
