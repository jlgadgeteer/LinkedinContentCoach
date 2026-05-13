import { Sidebar } from "@/components/workspace/sidebar";
import { KeyboardShortcuts } from "@/components/workspace/keyboard-shortcuts";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="app">
      <Sidebar />
      <main className="app__main">{children}</main>
      <KeyboardShortcuts />
    </div>
  );
}
