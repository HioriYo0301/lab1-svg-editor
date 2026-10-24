import { Command } from "../commands/Command.js";
import { HistoryError } from "./HistoryError.js";

export class History {
  private readonly undoCommands: Command[] = [];
  private readonly redoCommands: Command[] = [];
  private blockedByIo = false;

  public execute(command: Command): string {
    const result = command.execute();
    this.undoCommands.push(command);
    this.redoCommands.length = 0;
    this.blockedByIo = false;
    return result;
  }

  public undo(): string {
    this.ensureAvailable();
    const command = this.undoCommands.pop();
    if (command === undefined) throw new HistoryError("nothing to undo");
    const result = command.undo();
    this.redoCommands.push(command);
    return result;
  }

  public redo(): string {
    this.ensureAvailable();
    const command = this.redoCommands.pop();
    if (command === undefined) throw new HistoryError("nothing to redo");
    const result = command.execute();
    this.undoCommands.push(command);
    return result;
  }

  public markIoBoundary(): void {
    this.undoCommands.length = 0;
    this.redoCommands.length = 0;
    this.blockedByIo = true;
  }

  private ensureAvailable(): void {
    if (this.blockedByIo) throw new HistoryError("undo not allowed after io command");
  }
}
