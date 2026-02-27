import { useState } from "react";
import { toast } from "react-hot-toast";

const Help = () => {
  const [checking, setChecking] = useState(false);

  const handleCheckForUpdates = async () => {
    if (!window.qurt?.checkForUpdates) {
      toast("Updates are not available in development.");
      return;
    }
    setChecking(true);
    try {
      const result = await window.qurt.checkForUpdates();
      if (result.ok === false && result.reason === "dev") {
        toast("Updates are not available in development.");
        return;
      }
      toast("Checking for updates…");
    } finally {
      setChecking(false);
    }
  };

  return (
    <>
      <div className="mb-8 h4">Help</div>
      <div className="mb-5 base1 font-semibold">Updates</div>
      <p className="mb-4 body2 text-n-4">
        qurt checks for updates automatically. Use the button below to check
        now.
      </p>
      <button
        type="button"
        onClick={handleCheckForUpdates}
        disabled={checking || !window.qurt?.checkForUpdates}
        className="btn-blue btn-medium disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {checking ? "Checking…" : "Check for Updates"}
      </button>
    </>
  );
};

export default Help;
