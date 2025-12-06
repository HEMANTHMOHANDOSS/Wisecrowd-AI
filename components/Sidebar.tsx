
import React from 'react';
import { ViewState, SoundSettings, UserRole } from '../types';
import { LayoutDashboard, Activity, AlertTriangle, Settings, Map, ShieldCheck, Volume2, VolumeX, LogOut, Database, Globe } from 'lucide-react';

interface SidebarProps {
  currentView: ViewState;
  onViewChange: (view: ViewState) => void;
  soundSettings: SoundSettings;
  onSoundSettingsChange: (settings: SoundSettings) => void;
  onLogout: () => void;
  onSwitchEvent: () => void;
  eventName?: string;
  userRole: UserRole;
  userName: string;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  currentView, 
  onViewChange, 
  soundSettings, 
  onSoundSettingsChange, 
  onLogout, 
  onSwitchEvent, 
  eventName,
  userRole,
  userName
}) => {
  
  const allMenuItems = [
    { id: ViewState.DASHBOARD, icon: LayoutDashboard, label: 'Command Center', roles: ['admin', 'viewer'] },
    { id: ViewState.MAP, icon: Map, label: 'Venue Map', roles: ['admin', 'viewer'] },
    { id: ViewState.ANALYTICS, icon: Activity, label: 'Historical Analytics', roles: ['admin', 'viewer'] },
    { id: ViewState.ALERTS, icon: AlertTriangle, label: 'Risk Alerts', roles: ['admin', 'viewer'] },
    { id: ViewState.ADMIN, icon: Database, label: 'Admin Panel', roles: ['admin'] }, // Admin only
    { id: ViewState.SETTINGS, icon: Settings, label: 'System Config', roles: ['admin'] }, // Admin only
  ];

  const menuItems = allMenuItems.filter(item => item.roles.includes(userRole));

  return (
    <div className="w-64 glass h-screen flex flex-col fixed left-0 top-0 z-50 transition-transform duration-300">
      <div className="p-6 border-b border-slate-700/30 bg-slate-900/50">
        <div className="flex items-center gap-3 mb-4">
          <div className="relative">
             <div className="bg-gradient-to-tr from-blue-600 to-indigo-600 p-2.5 rounded-xl shadow-lg shadow-blue-500/20">
               <ShieldCheck className="w-6 h-6 text-white" />
             </div>
             <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
            </span>
          </div>
          <div>
            <h1 className="text-lg font-bold text-white tracking-tight leading-tight">WiseCrowd AI</h1>
            <p className="text-[9px] text-blue-300 font-medium tracking-wider uppercase mt-0.5">Powered by WiseCrew</p>
          </div>
        </div>

        {eventName ? (
          <div className="p-3 bg-white/5 rounded-lg border border-white/5">
             <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1">Monitoring Event</p>
             <p className="text-sm font-bold text-white truncate">{eventName}</p>
          </div>
        ) : (
          <div className="p-3 bg-white/5 rounded-lg border border-white/5 flex items-center gap-2">
            <Globe className="w-4 h-4 text-slate-400" />
            <p className="text-xs font-bold text-slate-300">Global View</p>
          </div>
        )}
      </div>

      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        <button
          onClick={onSwitchEvent}
          className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-slate-400 hover:bg-white/5 hover:text-slate-100 transition-all border border-transparent hover:border-white/5 mb-2"
        >
          <Globe className="w-5 h-5" />
          <span className="font-medium text-sm">Global Map</span>
        </button>

        <div className="h-px bg-white/5 my-2"></div>

        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onViewChange(item.id as ViewState)}
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-300 group relative overflow-hidden ${
              currentView === item.id
                ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.1)]'
                : 'text-slate-400 hover:bg-white/5 hover:text-slate-100'
            }`}
          >
            {currentView === item.id && (
               <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500 rounded-r-full"></div>
            )}
            <item.icon className={`w-5 h-5 transition-transform group-hover:scale-110 ${currentView === item.id ? 'text-blue-400' : ''}`} />
            <span className="font-medium text-sm">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-700/30 bg-slate-900/30 space-y-4">
        
        {/* User Info */}
        <div className="flex items-center gap-3 px-2">
           <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-white uppercase border border-white/10">
             {userName.substring(0,2)}
           </div>
           <div>
             <p className="text-xs font-bold text-white">{userName}</p>
             <p className="text-[10px] text-slate-400 uppercase tracking-wider">{userRole}</p>
           </div>
        </div>

        {/* Sound Settings */}
        <div className="bg-black/40 rounded-xl p-3 border border-white/5 backdrop-blur-md">
           <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Audio Alerts</span>
              <button 
                onClick={() => onSoundSettingsChange({...soundSettings, enabled: !soundSettings.enabled})}
                className={`p-1.5 rounded-lg transition-colors ${soundSettings.enabled ? 'bg-blue-500/20 text-blue-400' : 'bg-slate-700/50 text-slate-500'}`}
              >
                 {soundSettings.enabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
              </button>
           </div>
           {soundSettings.enabled && (
             <div className="flex items-center gap-2 mt-2">
                <input 
                  type="range" 
                  min="0" 
                  max="1" 
                  step="0.1" 
                  value={soundSettings.volume}
                  onChange={(e) => onSoundSettingsChange({...soundSettings, volume: parseFloat(e.target.value)})}
                  className="flex-1 h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500 hover:accent-blue-400"
                />
             </div>
           )}
        </div>

        {/* Logout */}
        <button 
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/10 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-bold text-sm">Sign Out</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
