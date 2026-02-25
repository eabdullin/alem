import { type ChangeEvent, useRef } from "react";
import { Icon } from "@/utils/icons";

type AddFileProps = {
  onSelectFiles?: (files: File[]) => void;
};

const AddFile = ({ onSelectFiles }: AddFileProps) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFilesChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    if (files.length > 0) {
      onSelectFiles?.(files);
    }
    event.target.value = "";
  };

  return (
    <>
      <button
        className="group flex items-center justify-center w-8 h-8 rounded-lg outline-none transition-colors hover:bg-n-3 dark:hover:bg-n-5"
        onClick={() => inputRef.current?.click()}
        type="button"
      >
        <Icon
          className="size-5 stroke-n-4 transition-colors group-hover:stroke-primary-1"
          name="plus-circle"
        />
      </button>
      <input
        ref={inputRef}
        className="hidden"
        type="file"
        multiple
        onChange={handleFilesChange}
      />
    </>
  );
};

export default AddFile;
