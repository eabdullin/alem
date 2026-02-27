import { useContext, useState, useEffect } from "react";
import { QurtContext } from "@/App";

const Terminal = () => {
  const { settings, updateSettings } = useContext(QurtContext);
  const [value, setValue] = useState(settings?.terminalShell ?? "");

  useEffect(() => {
    setValue(settings?.terminalShell ?? "");
  }, [settings?.terminalShell]);

  const handleBlur = () => {
    const trimmed = value.trim();
    if (trimmed !== (settings?.terminalShell ?? "")) {
      updateSettings({ ...settings, terminalShell: trimmed });
    }
  };

  return (
    <>
      <div className="mb-8 h4">Terminal</div>
      <div className="mb-5 base1 font-semibold">Shell</div>
      <p className="mb-4 body2 text-n-4">
        Path to your preferred shell for running commands. Leave empty to use the
        platform default (PowerShell on Windows, /bin/sh on macOS and Linux).
      </p>
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={handleBlur}
        placeholder="e.g. powershell.exe, pwsh.exe, cmd.exe, /bin/bash"
        className="w-full max-w-md px-4 py-2.5 rounded-xl border-2 border-n-3 bg-n-2 base2 text-n-7 placeholder:text-n-4 focus:border-primary-1 focus:outline-none dark:bg-n-6 dark:border-n-5 dark:text-n-1 dark:placeholder:text-n-4"
      />
    </>
  );
};

export default Terminal;
