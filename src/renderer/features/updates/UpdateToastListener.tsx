import { useEffect } from "react";
import { toast } from "react-hot-toast";
import Notify from "@/components/Notify";

export function UpdateToastListener() {
  useEffect(() => {
    if (!window.qurt?.onUpdateReady || !window.qurt?.applyUpdate) return;

    const unsubReady = window.qurt.onUpdateReady(() => {
      toast((t) => (
        <Notify className="md:flex-col md:items-center md:px-10">
          <div className="ml-3 mr-6 h6 md:mx-0 md:my-2">
            A new version is ready. Restart to apply.
          </div>
          <div className="flex justify-center">
            <button
              className="btn-stroke-light btn-medium md:min-w-[6rem]"
              onClick={() => toast.dismiss(t.id)}
            >
              Later
            </button>
            <button
              className="btn-blue btn-medium ml-3 md:min-w-[6rem]"
              onClick={() => {
                toast.dismiss(t.id);
                void window.qurt?.applyUpdate?.();
              }}
            >
              Restart
            </button>
          </div>
        </Notify>
      ));
    });

    const unsubUpToDate = window.qurt.onUpToDate?.(() => {
      toast.success("You're up to date.");
    }) ?? (() => {});

    return () => {
      unsubReady();
      unsubUpToDate();
    };
  }, []);

  return null;
}
