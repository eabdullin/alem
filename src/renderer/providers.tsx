import { Toaster } from "react-hot-toast";
import { UpdateToastListener } from "./features/updates/UpdateToastListener";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <UpdateToastListener />
      <Toaster
        position="bottom-center"
        gutter={10}
        toastOptions={{
          duration: 6000,
          className: 'flex items-center p-4 rounded-2xl bg-n-7 text-n-1 md:-mb-5',
          style: {
            maxWidth: '60%'
          },
        }}
        
      />
    </>
  );
}
