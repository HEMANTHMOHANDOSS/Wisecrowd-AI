

import React, { useState, useEffect, useRef } from 'react';
import { Alert, SoundSettings } from '../types';
import { AlertTriangle, CheckCircle, Clock, MapPin, XOctagon, Bell, History, CheckCheck } from 'lucide-react';

interface AlertsPanelProps {
  alerts: Alert[];
  onResolve: (id: string) => void;
  soundSettings: SoundSettings;
}

const AlertsPanel: React.FC<AlertsPanelProps> = ({ alerts, onResolve, soundSettings }) => {
  const [activeTab, setActiveTab] = useState<'active' | 'resolved'>('active');
  const previousActiveCount = useRef(alerts.filter(a => !a.resolved).length);

  // Filter alerts based on tab and sort by time (newest first)
  const displayedAlerts = alerts
    .filter(a => activeTab === 'active' ? !a.resolved : a.resolved)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  // Sound Effect Logic for New Alerts
  useEffect(() => {
    const currentActiveCount = alerts.filter(a => !a.resolved).length;
    
    // Only play if active count increased (meaning a new alert came in, not just one being resolved)
    // And if sound is enabled in settings
    if (currentActiveCount > previousActiveCount.current && soundSettings.enabled) {
      playAlertSound();
    }
    
    previousActiveCount.current = currentActiveCount;
  }, [alerts, soundSettings.enabled]);

  const playAlertSound = () => {
    try {
      // Create a secure, dependency-free sound using Web Audio API
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      // Futuristic Alert Sound parameters
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.5);
      
      // Use configured volume (scaled down a bit as raw sine waves are loud)
      const targetVol = soundSettings.volume * 0.2;
      
      gain.gain.setValueAtTime(targetVol, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);

      osc.start();
      osc.stop(ctx.currentTime + 0.6);
    } catch (e) {
      console.error("Audio playback blocked (user interaction required first)", e);
    }
  };

  const getSeverityStyles = (severity: string) => {
    switch (severity) {
      case 'critical': return { icon: XOctagon, color: 'text-red-500', bg: 'bg-red-500/10', border: 'border-red-500/20' };
      case 'high': return { icon: AlertTriangle, color: 'text-orange-500', bg: 'bg-orange-500/10', border: 'border-orange-500/20' };
      case 'medium': return { icon: AlertTriangle, color: 'text-yellow-500', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20' };
      default: return { icon: AlertTriangle, color: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-500/20' };
    }
  };

  return (
    <div className="glass rounded-2xl overflow-hidden flex flex-col h-full shadow-2xl transition-all duration-300">
      {/* Header with Tabs */}
      <div className="border-b border-white/5 bg-slate-900/40">
        <div className="flex items-center justify-between p-5 pb-2">
           <h3 className="font-bold text-white flex items-center gap-2 mb-2">
             <div className="relative">
                {alerts.some(a => !a.resolved) && (
                  <span className="absolute -top-1 -right-1 flex h-2 w-2">
                     <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                     <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                  </span>
                )}
                <AlertTriangle className="w-5 h-5 text-slate-200" />
             </div>
             System Alerts
           </h3>
        </div>
        
        <div className="flex px-5 gap-6">
          <button 
            onClick={() => setActiveTab('active')}
            className={`pb-3 text-xs font-bold uppercase tracking-wider transition-all border-b-2 flex items-center gap-2 ${
              activeTab === 'active' 
                ? 'text-blue-400 border-blue-500' 
                : 'text-slate-500 border-transparent hover:text-slate-300'
            }`}
          >
            <Bell className="w-3.5 h-3.5" />
            Active ({alerts.filter(a => !a.resolved).length})
          </button>
          <button 
            onClick={() => setActiveTab('resolved')}
            className={`pb-3 text-xs font-bold uppercase tracking-wider transition-all border-b-2 flex items-center gap-2 ${
              activeTab === 'resolved' 
                ? 'text-emerald-400 border-emerald-500' 
                : 'text-slate-500 border-transparent hover:text-slate-300'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            History
          </button>
        </div>
      </div>
      
      <div className="overflow-y-auto max-h-[500px] p-4 space-y-3 custom-scrollbar flex-1 relative">
        {displayedAlerts.length === 0 ? (
           <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500">
             <div className="w-14 h-14 rounded-full bg-slate-800/50 flex items-center justify-center mb-3 border border-white/5">
                {activeTab === 'active' ? <CheckCircle className="w-7 h-7 text-emerald-500/50" /> : <History className="w-7 h-7 text-slate-500" />}
             </div>
             <p className="text-sm font-medium text-slate-400">No {activeTab} alerts</p>
             <p className="text-xs text-slate-600 mt-1">System monitoring active</p>
           </div>
        ) : (
          displayedAlerts.map(alert => {
            const style = getSeverityStyles(alert.severity);
            const Icon = style.icon;
            
            return (
              <div 
                key={alert.id}
                className={`p-4 rounded-xl border flex gap-4 transition-all duration-500 animate-in slide-in-from-right-4 fade-in ${
                  alert.resolved 
                    ? 'bg-slate-900/30 border-white/5 opacity-60 grayscale-[0.6] hover:grayscale-0 hover:opacity-100' 
                    : `bg-slate-900/60 backdrop-blur-md ${style.border} hover:translate-x-1 hover:bg-slate-800/80`
                }`}
              >
                <div className={`p-2.5 rounded-lg h-fit flex-shrink-0 ${alert.resolved ? 'bg-slate-800 text-slate-500' : `${style.bg} ${style.color}`}`}>
                  <Icon className="w-5 h-5" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <h4 className={`text-sm font-bold ${alert.resolved ? 'text-slate-400' : 'text-slate-200'} truncate`}>
                      {alert.title || "System Alert"}
                    </h4>
                    {!alert.resolved ? (
                      <span className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded ${style.bg} ${style.color}`}>
                        {alert.severity}
                      </span>
                    ) : (
                      <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-500 flex items-center gap-1">
                        <CheckCheck className="w-3 h-3" /> Resolved
                      </span>
                    )}
                  </div>
                  
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">{alert.message}</p>
                  
                  <div className="flex items-center gap-4 mt-3 text-[10px] text-slate-500 font-medium">
                    <span className="flex items-center gap-1">
                       <Clock className="w-3 h-3" />
                       {new Date(alert.timestamp).toLocaleTimeString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {alert.location}
                    </span>
                  </div>
                </div>
                
                {!alert.resolved && (
                  <button 
                    onClick={() => onResolve(alert.id)}
                    className="self-center ml-2 p-2 rounded-lg bg-white/5 hover:bg-green-500/20 text-slate-400 hover:text-green-400 transition-all border border-transparent hover:border-green-500/30 group"
                    title="Mark as Resolved"
                  >
                    <CheckCircle className="w-5 h-5 group-active:scale-90 transition-transform" />
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default AlertsPanel;