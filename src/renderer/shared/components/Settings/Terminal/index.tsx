import { useContext, useEffect, useState } from "react";
import { AlemContext } from "@/App";

const Terminal = () => {
  const { settings, updateSettings } = useContext(AlemContext);
  const [workspaceRoot, setWorkspaceRoot] = useState(
    settings?.terminalWorkspaceRoot ?? ""
  );
  const [resolvedRoot, setResolvedRoot] = useState<string>("");

  useEffect(() => {
    setWorkspaceRoot(settings?.terminalWorkspaceRoot ?? "");
  }, [settings?.terminalWorkspaceRoot]);

  useEffect(() => {
    if (typeof window !== "undefined" && window.alem?.getTerminalWorkspaceRoot) {
      window.alem.getTerminalWorkspaceRoot().then(setResolvedRoot);
    }
  }, [settings?.terminalWorkspaceRoot]);

  const handleBlur = async () => {
    const value = workspaceRoot.trim();
    const next = { ...settings, terminalWorkspaceRoot: value || undefined };
    await updateSettings(next);
    if (window.alem?.getTerminalWorkspaceRoot) {
      window.alem.getTerminalWorkspaceRoot().then(setResolvedRoot);
    }
  };

  return (
    <>
      <div className="mb-8 h4">Terminal (Agent)</div>
      <div className="mb-5 base1 font-semibold">Workspace directory</div>
      <p className="base2 text-n-4 mb-4">
        Commands run by the agent must use a working directory inside this path.
        Leave empty to use your Documents folder.
      </p>
      <input
        type="text"
        className="w-full max-w-md rounded border border-n-4 bg-n-2 px-3 py-2 font-mono text-sm dark:bg-n-6 dark:border-n-5"
        placeholder="e.g. C:\Users\You\projects"
        value={workspaceRoot}
        onChange={(e) => setWorkspaceRoot(e.target.value)}
        onBlur={handleBlur}
      />
      {resolvedRoot && (
        <p className="mt-2 text-xs text-n-4">
          Resolved: <code className="rounded bg-n-3/50 px-1 dark:bg-n-6">{resolvedRoot}</code>
        </p>
      )}
    </>
  );
};

export default Terminal;
