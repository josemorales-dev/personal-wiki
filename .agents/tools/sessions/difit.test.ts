import { describe, expect, test } from "bun:test";
import { parseDifitServer } from "./difit.ts";

describe("parseDifitServer", () => {
  test("reads the port and URL from the JSON line, after any other output", () => {
    expect(parseDifitServer('Resolving difit...\n{"port":4967,"url":"http://localhost:4967","pid":42}\n')).toEqual({
      ok: true,
      value: { port: 4967, url: "http://localhost:4967", pid: 42 },
    });
  });

  test("fails when the server line has no pid to stop it by", () => {
    expect(parseDifitServer('{"port":4967,"url":"http://localhost:4967"}\n')).toMatchObject({ ok: false });
  });

  test("fails when no line carries a server address", () => {
    expect(parseDifitServer("error: not a git repository\n")).toEqual({
      ok: false,
      error: "difit printed no server address: error: not a git repository",
    });
  });
});
