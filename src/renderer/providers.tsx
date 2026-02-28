import { Toaster, resolveValue } from "react-hot-toast";
import { UpdateToastListener } from "./features/updates/UpdateToastListener";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <UpdateToastListener />
      <Toaster
        containerStyle={{
          bottom: 40,
          left: 20,
          right: 20,
        }}
        position="bottom-center"
        gutter={10}
        toastOptions={{
          duration: 4000,
        }}
      >
        {(t) => (
          <div
            style={{
              opacity: t.visible ? 1 : 0,
              transform: t.visible ? "translatey(0)" : "translatey(0.75rem)",
              transition: "all .2s",
            }}
          >
            {resolveValue(t.message, t)}
          </div>
        )}
      </Toaster>
    </>
  );
}
