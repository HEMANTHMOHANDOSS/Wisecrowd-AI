import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  label: string;
  value: string | number;
  change?: string;
  isPositive?: boolean;
  icon: LucideIcon;
  color?: string;
  subtext?: string;
}

const StatsCard: React.FC<StatsCardProps> = ({ label, value, change, isPositive, icon: Icon, color = "blue", subtext }) => {
  const styles = {
    blue: { bg: "from-blue-500/20 to-blue-600/5", text: "text-blue-400", border: "border-blue-500/20", iconBg: "bg-blue-500/20" },
    green: { bg: "from-emerald-500/20 to-emerald-600/5", text: "text-emerald-400", border: "border-emerald-500/20", iconBg: "bg-emerald-500/20" },
    red: { bg: "from-rose-500/20 to-rose-600/5", text: "text-rose-400", border: "border-rose-500/20", iconBg: "bg-rose-500/20" },
    amber: { bg: "from-amber-500/20 to-amber-600/5", text: "text-amber-400", border: "border-amber-500/20", iconBg: "bg-amber-500/20" },
    purple: { bg: "from-purple-500/20 to-purple-600/5", text: "text-purple-400", border: "border-purple-500/20", iconBg: "bg-purple-500/20" },
  };

  const style = styles[color as keyof typeof styles] || styles.blue;

  return (
    <div className={`glass relative overflow-hidden rounded-2xl p-5 border ${style.border} group transition-all duration-300 hover:shadow-lg hover:shadow-${color}-500/10`}>
      <div className={`absolute inset-0 bg-gradient-to-br ${style.bg} opacity-50 group-hover:opacity-70 transition-opacity`}></div>
      
      <div className="relative z-10 flex justify-between items-start">
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{label}</p>
          <h3 className="text-2xl font-bold text-white mt-2 tracking-tight">{value}</h3>
          {subtext && <p className="text-xs text-slate-400 mt-1">{subtext}</p>}
        </div>
        <div className={`p-2.5 rounded-xl ${style.iconBg} ${style.text} backdrop-blur-md shadow-inner border border-white/5`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      
      {change && (
        <div className="relative z-10 mt-4 flex items-center text-xs font-medium">
          <span className={`flex items-center gap-1 px-1.5 py-0.5 rounded ${isPositive ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
            {isPositive ? "↑" : "↓"} {change}
          </span>
          <span className="text-slate-500 ml-2">vs last hour</span>
        </div>
      )}
    </div>
  );
};

export default StatsCard;