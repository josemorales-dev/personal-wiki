const { describe, expect, test } = require("bun:test");
const { isSessionWorktree } = require("./session-worktree.js");

describe("isSessionWorktree", () => {
  test("accepts a folder inside a .worktrees folder", () => {
    expect(isSessionWorktree("/Users/me/Projects/app.worktrees/add-login")).toBe(true);
  });

  test("rejects a project checkout", () => {
    expect(isSessionWorktree("/Users/me/Projects/app")).toBe(false);
  });

  test("rejects a folder nested deeper inside a worktree", () => {
    expect(isSessionWorktree("/Users/me/Projects/app.worktrees/add-login/src")).toBe(false);
  });
});
