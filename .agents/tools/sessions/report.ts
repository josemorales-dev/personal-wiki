import type { Status } from "./session.ts";

const STYLES = { bold: "1", dim: "2", red: "31", green: "32", yellow: "33", cyan: "36" } as const;
export type Style = keyof typeof STYLES;

export const STATUS_STYLE: Readonly<Record<Status, Style>> = {
  aligning: "cyan",
  "awaiting-approval": "yellow",
  building: "cyan",
  reviewing: "cyan",
  blocked: "red",
  shipped: "green",
  done: "green",
};

export function paint(color: boolean, style: Style, text: string): string {
  return color ? `\u001b[${STYLES[style]}m${text}\u001b[0m` : text;
}

export type Cell = { readonly text: string; readonly style: Style | undefined };

export function cell(text: string, style?: Style): Cell {
  return { text, style };
}

/** Left-aligned columns under a bold header. The last column is not padded. */
export function table(color: boolean, header: readonly string[], rows: readonly (readonly Cell[])[]): string {
  const widths = header.map((title, column) =>
    Math.max(title.length, ...rows.map((row) => row[column]?.text.length ?? 0)),
  );
  const line = (cells: readonly Cell[]): string => {
    const columns = cells.map((current, column) => {
      const last = column === cells.length - 1;
      const text = last ? current.text : current.text.padEnd(widths[column] ?? 0);
      return current.style === undefined ? text : paint(color, current.style, text);
    });
    return `${columns.join("  ").trimEnd()}\n`;
  };
  return line(header.map((title) => cell(title, "bold"))) + rows.map(line).join("");
}

/** Two-column key and value lines, indented under a heading. */
export function fields(color: boolean, rows: readonly (readonly [string, string])[]): string {
  const width = Math.max(...rows.map(([key]) => key.length));
  return rows.map(([key, value]) => `  ${paint(color, "dim", key.padEnd(width))}  ${value}\n`).join("");
}

export function relativeAge(isoTime: string, now: Date): string {
  const seconds = Math.max(0, Math.floor((now.getTime() - Date.parse(isoTime)) / 1000));
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}
