import { toast } from "react-hot-toast";
import Notify from "@/components/Notify";



type RestoreCheckpointToastContentProps = {
  onCancel: () => void;
  onRestore: () => void;
};

function RestoreCheckpointToastContent({
  onCancel,
  onRestore,
}: RestoreCheckpointToastContentProps) {
  return (
    <Notify
      className="md:flex-col md:items-center md:px-10"
      iconDelete
    >
      <div className="ml-3 mr-6 md:mx-0 md:my-2">
        <div className="h6">Restore checkpoint?</div>
        <p className="mt-1.5 base2 text-n-3">
          This will revert filesystem changes and remove messages after this point. Current
          files will be moved to{" "}
          <code className="rounded bg-n-5 px-1 dark:bg-n-5">.qurt/checkpoint-trash</code>.
        </p>
      </div>
      <div className="flex justify-center">
        <button
          className="btn-stroke-light btn-medium md:min-w-[6rem]"
          onClick={onCancel}
        >
          Cancel
        </button>
        <button
          className="btn-blue btn-medium ml-3 md:min-w-[6rem]"
          onClick={onRestore}
        >
          Restore
        </button>
      </div>
    </Notify>
  );
}

export function showRestoreCheckpointToast(
  userMessageIndex: number,
  onRestore: (userMessageIndex: number) => void | Promise<void>,
) {
  toast((t) => (
    <RestoreCheckpointToastContent
      onCancel={() => toast.dismiss(t.id)}
      onRestore={() => {
        void onRestore(userMessageIndex);
        toast.dismiss(t.id);
      }}
    />
  ));
}
