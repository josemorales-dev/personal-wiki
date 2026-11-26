const path = require("node:path");

/** Whether `folder` is a session worktree: `<project>.worktrees/<id>`, as `sessions start` creates it. */
function isSessionWorktree(folder) {
  return path.basename(path.dirname(folder)).endsWith(".worktrees");
}

module.exports = { isSessionWorktree };
