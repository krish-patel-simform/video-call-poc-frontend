import React from "react";

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  hoverBorderColor?: string;
  iconBgColor?: string;
  iconTextColor?: string;
  iconBorderColor?: string;
}

export function FeatureCard({
  icon,
  title,
  description,
  hoverBorderColor = "hover:border-indigo-500/40",
  iconBgColor = "bg-indigo-500/10",
  iconTextColor = "text-indigo-400",
  iconBorderColor = "border-indigo-500/20",
}: FeatureCardProps) {
  return (
    <div
      className={`bg-slate-900/50 border border-slate-800/80 rounded-2xl p-6 ${hoverBorderColor} transition-all duration-300`}
    >
      <div
        className={`w-12 h-12 rounded-xl ${iconBgColor} ${iconTextColor} flex items-center justify-center mb-4 border ${iconBorderColor}`}
      >
        {icon}
      </div>
      <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
      <p className="text-sm text-slate-400 leading-relaxed">{description}</p>
    </div>
  );
}
