interface ToastNotificationProps {
  message: string;
  isVisible: boolean;
}

export function ToastNotification({
  message,
  isVisible,
}: ToastNotificationProps) {
  if (!isVisible) return null;

  return (
    <div className="fixed top-5 right-5 z-50 flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-4 py-3 rounded-xl shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-top-3 duration-300">
      <svg
        className="w-5 h-5 text-emerald-400 flex-shrink-0"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M5 13l4 4L19 7"
        />
      </svg>
      <span className="text-sm font-medium">{message}</span>
    </div>
  );
}
