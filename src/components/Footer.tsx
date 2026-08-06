export function Footer() {
  return (
    <footer className="w-full max-w-7xl mx-auto px-6 py-6 flex flex-col sm:flex-row items-center justify-between border-t border-slate-900 text-xs text-slate-500 z-10 gap-4">
      <div>© 2026 OmniMeet Inc. All rights reserved.</div>
      <div className="flex items-center gap-6">
        <span className="hover:text-slate-400 cursor-pointer transition-colors">
          Privacy Policy
        </span>
        <span className="hover:text-slate-400 cursor-pointer transition-colors">
          Terms of Service
        </span>
        <span className="hover:text-slate-400 cursor-pointer transition-colors">
          WebRTC Diagnostics
        </span>
      </div>
    </footer>
  );
}
