const vscode = require("vscode");
const { isSessionWorktree } = require("./session-worktree.js");

const REPOSITORY_WAIT_MS = 30_000;

/**
 * In a session worktree, closes the sidebar and shows the Changes editor when the window opens and whenever
 * `sessions review` sends `vscode://local.vscode-review/show-changes`, which reaches a window that is already open.
 */
function activate(context) {
  const folders = vscode.workspace.workspaceFolders ?? [];
  const folder = folders.length === 1 && isSessionWorktree(folders[0].uri.fsPath) ? folders[0].uri : undefined;
  context.subscriptions.push(
    vscode.window.registerUriHandler({ handleUri: () => (folder === undefined ? undefined : showChanges(folder)) }),
  );
  if (folder !== undefined) void showChanges(folder);
}

async function showChanges(folder) {
  try {
    const gitExtension = vscode.extensions.getExtension("vscode.git");
    if (gitExtension === undefined) return warn("the built-in Git extension is disabled");
    const git = (await gitExtension.activate()).getAPI(1);
    const repository = await openedRepository(git, folder);
    if (repository === undefined) return warn(`Git opened no repository for ${folder.fsPath}`);
    await repository.status();
    if (repository.state.indexChanges.length > 0) {
      await vscode.commands.executeCommand("git.viewStagedChanges", repository.rootUri);
    }
    await vscode.commands.executeCommand("git.viewChanges", repository.rootUri);
    await vscode.commands.executeCommand("workbench.action.closeSidebar");
  } catch (error) {
    warn(error instanceof Error ? error.message : String(error));
  }
}

function openedRepository(git, folder) {
  const found = () => git.getRepository(folder) ?? undefined;
  if (found() !== undefined) return Promise.resolve(found());
  return new Promise((resolve) => {
    const opened = git.onDidOpenRepository(() => {
      if (found() === undefined) return;
      clearTimeout(timer);
      opened.dispose();
      resolve(found());
    });
    const timer = setTimeout(() => {
      opened.dispose();
      resolve(undefined);
    }, REPOSITORY_WAIT_MS);
  });
}

function warn(reason) {
  void vscode.window.showWarningMessage(`VS Code review: the Changes editor did not open: ${reason}.`);
}

module.exports = { activate };
