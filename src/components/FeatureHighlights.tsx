import { FeatureCard } from "./FeatureCard";

export function FeatureHighlights() {
  return (
    <section className="w-full max-w-7xl mx-auto px-6 py-12 border-t border-slate-900 z-10">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <FeatureCard
          title="HD Video & Spatial Audio"
          description="Crystal-clear 1080p video streaming paired with echo cancellation and background noise suppression."
          hoverBorderColor="hover:border-indigo-500/40"
          iconBgColor="bg-indigo-500/10"
          iconTextColor="text-indigo-400"
          iconBorderColor="border-indigo-500/20"
          icon={
            <svg
              className="w-6 h-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
          }
        />

        <FeatureCard
          title="Instant Screen Share"
          description="Present slides, browser tabs, or desktop application windows in real-time with 60 FPS clarity."
          hoverBorderColor="hover:border-violet-500/40"
          iconBgColor="bg-violet-500/10"
          iconTextColor="text-violet-400"
          iconBorderColor="border-violet-500/20"
          icon={
            <svg
              className="w-6 h-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
          }
        />

        <FeatureCard
          title="Secure Signaling"
          description="Protected rooms built on encrypted WebRTC signaling, strict room codes, and role management."
          hoverBorderColor="hover:border-emerald-500/40"
          iconBgColor="bg-emerald-500/10"
          iconTextColor="text-emerald-400"
          iconBorderColor="border-emerald-500/20"
          icon={
            <svg
              className="w-6 h-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          }
        />
      </div>
    </section>
  );
}
