export function MeetingCardMockup() {
  return (
    <div className="lg:col-span-5">
      <div className="relative mx-auto max-w-md lg:max-w-none">
        {/* Ambient Backlight Glow */}
        <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-3xl blur-xl opacity-30 animate-pulse" />

        {/* Video Call Mockup Container */}
        <div className="relative bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl p-4 space-y-4">
          {/* Mock Video Grid Header */}
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 px-2">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-rose-500 inline-block" />
              <span className="w-3 h-3 rounded-full bg-amber-500 inline-block" />
              <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" />
            </div>
            <div className="text-xs text-slate-400 font-mono bg-slate-950 px-2.5 py-1 rounded-md border border-slate-800">
              LIVE • 00:24:18
            </div>
          </div>

          {/* Mock Tiles Grid */}
          <div className="grid grid-cols-2 gap-3 aspect-video">
            {/* Tile 1: Primary User */}
            <div className="relative bg-slate-950 rounded-2xl overflow-hidden border-2 border-emerald-500/60 shadow-lg flex items-center justify-center group">
              <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-xl font-bold text-white shadow-inner">
                YOU
              </div>
              {/* Speaker Wave Icon */}
              <div className="absolute top-2 right-2 bg-emerald-500/20 text-emerald-400 p-1.5 rounded-lg backdrop-blur-md flex items-center gap-1">
                <span className="w-1 h-3 bg-emerald-400 rounded-full animate-bounce" />
                <span className="w-1 h-4 bg-emerald-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                <span className="w-1 h-2 bg-emerald-400 rounded-full animate-bounce [animation-delay:0.4s]" />
              </div>
              <div className="absolute bottom-2 left-2 bg-slate-900/80 backdrop-blur-md px-2.5 py-1 rounded-md text-[11px] font-medium text-slate-200 border border-slate-800">
                You (Host)
              </div>
            </div>

            {/* Tile 2: Remote Peer */}
            <div className="relative bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 flex items-center justify-center">
              <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-slate-800 to-slate-700 flex items-center justify-center text-xl font-bold text-slate-300">
                AK
              </div>
              <div className="absolute top-2 right-2 bg-slate-900/80 text-rose-400 p-1.5 rounded-lg border border-slate-800">
                <svg
                  className="w-3.5 h-3.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                  />
                </svg>
              </div>
              <div className="absolute bottom-2 left-2 bg-slate-900/80 backdrop-blur-md px-2.5 py-1 rounded-md text-[11px] font-medium text-slate-200 border border-slate-800">
                Alex K.
              </div>
            </div>
          </div>

          {/* Mock Floating Toolbar Controls */}
          <div className="bg-slate-950/90 border border-slate-800 rounded-2xl p-2.5 flex items-center justify-around backdrop-blur-md">
            <button
              type="button"
              className="p-2.5 rounded-xl bg-slate-850 hover:bg-slate-800 text-slate-200 border border-slate-750 transition-colors cursor-pointer"
              aria-label="Microphone"
            >
              <svg
                className="w-5 h-5 text-emerald-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                />
              </svg>
            </button>
            <button
              type="button"
              className="p-2.5 rounded-xl bg-slate-850 hover:bg-slate-800 text-slate-200 border border-slate-750 transition-colors cursor-pointer"
              aria-label="Camera"
            >
              <svg
                className="w-5 h-5 text-emerald-400"
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
            </button>
            <button
              type="button"
              className="p-2.5 rounded-xl bg-indigo-600/20 border border-indigo-500/40 text-indigo-400 hover:bg-indigo-600/30 transition-colors cursor-pointer"
              aria-label="Share Screen"
            >
              <svg
                className="w-5 h-5"
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
            </button>
            <button
              type="button"
              className="p-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/30 transition-colors cursor-pointer"
              aria-label="Leave Call"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M5 3a2 2 0 00-2 2v1c0 8.284 6.716 15 15 15h1a2 2 0 002-2v-3.28a1 1 0 00-.684-.948l-4.493-1.498a1 1 0 00-1.21.502l-1.13 2.257a11.042 11.042 0 01-5.516-5.517l2.257-1.128a1 1 0 00.502-1.21L9.228 3.683A1 1 0 008.279 3H5z"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
