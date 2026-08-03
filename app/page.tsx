import { ChatPanel } from "@/components/ChatPanel";
import { SourceViewer } from "@/components/SourceViewer";
import { TopBar } from "@/components/TopBar";

export default function Home() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.12),_transparent_30%),linear-gradient(135deg,#020617_0%,#0f172a_45%,#020617_100%)] text-slate-50">
      <TopBar />

      <main className="mx-auto flex h-[calc(100vh-73px)] w-full max-w-[1600px] items-stretch gap-4 px-4 py-4">
        <div className="w-[40%] min-w-[360px]">
          <ChatPanel />
        </div>

        <div className="w-[60%] min-w-[420px]">
          <SourceViewer />
        </div>
      </main>
    </div>
  );
}
