
import React, { useState, useRef, useEffect } from 'react';
import { CameraFeed, Detection } from '../types';
import { Maximize2, Minimize2, BrainCircuit, ShieldAlert, Target, Activity, Settings, X, Check, Sliders } from 'lucide-react';
import { analyzeSurveillanceImage } from '../services/geminiService';

interface LiveFeedProps {
  feeds: CameraFeed[];
  detections: Record<string, Detection[]>;
  onTriggerAnalysis: (report: string) => void;
}

interface StreamConfig {
  resolution: '480p' | '720p' | '1080p' | '4k';
  fps: number;
  quality: number; // 1-100
}

const LiveFeed: React.FC<LiveFeedProps> = ({ feeds, detections, onTriggerAnalysis }) => {
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);
  const [showAiOverlay, setShowAiOverlay] = useState(true);
  const [fullscreenId, setFullscreenId] = useState<string | null>(null);
  const [settingsOpenId, setSettingsOpenId] = useState<string | null>(null);
  
  // State for stream configurations per camera
  const [streamConfigs, setStreamConfigs] = useState<Record<string, StreamConfig>>({});
  
  const feedRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Initialize default settings for feeds
  useEffect(() => {
    const defaults: Record<string, StreamConfig> = {};
    feeds.forEach(feed => {
      defaults[feed.id] = {
        resolution: '1080p',
        fps: 30,
        quality: 80
      };
    });
    setStreamConfigs(prev => ({ ...defaults, ...prev }));
  }, [feeds]);

  useEffect(() => {
    const handleFullScreenChange = () => {
      const fsElement = document.fullscreenElement;
      if (!fsElement) {
        setFullscreenId(null);
      } else {
        const entry = Object.entries(feedRefs.current).find(([key, el]) => el === fsElement);
        if (entry) {
          setFullscreenId(entry[0]);
        }
      }
    };

    document.addEventListener('fullscreenchange', handleFullScreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullScreenChange);
  }, []);

  const toggleFullscreen = async (feedId: string) => {
    const element = feedRefs.current[feedId];
    if (!element) return;

    if (!document.fullscreenElement) {
      try {
        await element.requestFullscreen();
      } catch (err) {
        console.error("Error entering fullscreen:", err);
      }
    } else {
      if (document.exitFullscreen) {
        await document.exitFullscreen();
      }
    }
  };

  const handleAnalyze = async (feed: CameraFeed) => {
    setAnalyzingId(feed.id);
    try {
      const targetUrl = feed.imageUrl || feed.streamUrl;
      if (!targetUrl) throw new Error("No image source available");

      const response = await fetch(targetUrl);
      const blob = await response.blob();
      const reader = new FileReader();
      
      reader.onloadend = async () => {
        const base64data = reader.result as string;
        const base64Content = base64data.split(',')[1];
        const report = await analyzeSurveillanceImage(base64Content, feed.location);
        onTriggerAnalysis(report);
        setAnalyzingId(null);
      };
      
      reader.readAsDataURL(blob);
    } catch (err) {
      console.error(err);
      onTriggerAnalysis("Failed to capture image for analysis. Ensure camera is online.");
      setAnalyzingId(null);
    }
  };

  const updateConfig = (feedId: string, key: keyof StreamConfig, value: any) => {
    setStreamConfigs(prev => ({
      ...prev,
      [feedId]: {
        ...prev[feedId],
        [key]: value
      }
    }));
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {feeds.map((feed) => {
        const config = streamConfigs[feed.id] || { resolution: '1080p', fps: 30, quality: 80 };

        return (
          <div 
            key={feed.id} 
            ref={(el) => { if(el) feedRefs.current[feed.id] = el; }}
            className={`group relative glass rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/10 transition-all duration-300 ${
              fullscreenId === feed.id ? 'rounded-none ring-0' : ''
            }`}
          >
            
            {/* Header */}
            <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/90 via-black/50 to-transparent z-20 flex justify-between items-start pointer-events-none">
              <div className="flex items-center gap-3">
                <div className="relative">
                   <div className={`w-2.5 h-2.5 rounded-full ${feed.status === 'active' ? 'bg-green-500' : 'bg-red-500'} shadow-[0_0_10px_currentColor]`}></div>
                   {feed.status === 'active' && <div className="absolute inset-0 rounded-full bg-green-500 animate-ping opacity-75"></div>}
                </div>
                <div>
                  <h3 className="text-white font-bold text-sm tracking-wide drop-shadow-md flex items-center gap-2">
                    {feed.name}
                    <span className="text-[9px] bg-white/10 px-1.5 py-0.5 rounded border border-white/10 font-mono">
                      {config.resolution} • {config.fps}FPS
                    </span>
                  </h3>
                  <p className="text-[10px] text-slate-300 font-mono uppercase tracking-wider">{feed.location} • ID: {feed.id}</p>
                </div>
              </div>
              
              <div className="flex gap-2">
                 <div className={`px-2 py-1 rounded backdrop-blur-md border border-white/10 text-[10px] font-bold font-mono flex items-center gap-1.5 shadow-lg ${
                   feed.riskLevel === 'critical' ? 'bg-red-500/80 text-white animate-pulse' : 
                   feed.riskLevel === 'high' ? 'bg-orange-500/80 text-white' :
                   'bg-black/60 text-green-400'
                 }`}>
                    {feed.riskLevel === 'critical' && <ShieldAlert className="w-3 h-3" />}
                    DENSITY: {Math.round((feed.currentCount / feed.capacity) * 100)}%
                 </div>
              </div>
            </div>

            {/* Feed Content */}
            <div className="relative aspect-video bg-slate-900 overflow-hidden">
               <img 
                 src={feed.streamUrl || feed.imageUrl} 
                 alt={feed.name} 
                 className="w-full h-full object-cover"
                 crossOrigin="anonymous"
               />
               
               {/* Scanlines */}
               <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-10 pointer-events-none bg-[length:100%_4px,6px_100%] opacity-20"></div>

               {/* AI Overlay */}
               {showAiOverlay && detections[feed.id] && (
                 <div className="absolute inset-0 z-10 pointer-events-none">
                    {detections[feed.id].map((box, idx) => (
                      <div 
                        key={`${feed.id}-det-${idx}`}
                        className="absolute flex flex-col items-start transition-all duration-100 ease-linear"
                        style={{
                          left: `${box.x}%`,
                          top: `${box.y}%`,
                          width: `${box.w}%`,
                          height: `${box.h}%`,
                        }}
                      >
                        <div className="absolute inset-0 border-2 border-opacity-60" style={{ borderColor: box.color, clipPath: 'polygon(0 0, 20% 0, 20% 0, 0 0, 0 20%, 0 0, 100% 0, 100% 20%, 100% 0, 100% 0, 100% 100%, 80% 100%, 100% 100%, 100% 100%, 0 100%, 0 80%, 0 100%)' }}></div>
                        
                        <div className="absolute -top-5 left-0 flex items-center gap-1 bg-black/80 backdrop-blur px-1.5 py-0.5 rounded-sm border border-white/10" style={{ borderLeftColor: box.color, borderLeftWidth: '2px' }}>
                          <span className="text-[9px] font-bold text-white uppercase tracking-tighter">{box.label}</span>
                          <span className="text-[8px] font-mono text-slate-300">{Math.floor(box.confidence * 100)}%</span>
                        </div>
                      </div>
                    ))}
                 </div>
               )}

               {/* Stream Settings Overlay */}
               {settingsOpenId === feed.id && (
                  <div className="absolute inset-0 z-40 bg-slate-900/90 backdrop-blur-md flex flex-col items-center justify-center p-8 animate-in fade-in duration-200">
                     <div className="w-full max-w-sm space-y-6">
                        <div className="flex justify-between items-center border-b border-white/10 pb-4">
                           <h3 className="text-lg font-bold text-white flex items-center gap-2">
                             <Sliders className="w-5 h-5 text-blue-400" />
                             Stream Configuration
                           </h3>
                           <button 
                             onClick={() => setSettingsOpenId(null)}
                             className="p-1 hover:bg-white/10 rounded-full transition-colors"
                           >
                             <X className="w-5 h-5 text-slate-400" />
                           </button>
                        </div>

                        {/* Resolution Control */}
                        <div className="space-y-3">
                           <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Resolution</label>
                           <div className="grid grid-cols-4 gap-2">
                              {['480p', '720p', '1080p', '4k'].map((res) => (
                                <button
                                  key={res}
                                  onClick={() => updateConfig(feed.id, 'resolution', res)}
                                  className={`py-2 px-1 rounded-lg text-xs font-bold transition-all border ${
                                    config.resolution === res 
                                      ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/20' 
                                      : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'
                                  }`}
                                >
                                  {res.toUpperCase()}
                                </button>
                              ))}
                           </div>
                        </div>

                        {/* FPS Control */}
                        <div className="space-y-3">
                           <div className="flex justify-between text-xs">
                             <label className="font-bold text-slate-400 uppercase tracking-wider">Frame Rate</label>
                             <span className="text-blue-400 font-mono">{config.fps} FPS</span>
                           </div>
                           <input 
                             type="range" 
                             min="5" 
                             max="60" 
                             step="5"
                             value={config.fps}
                             onChange={(e) => updateConfig(feed.id, 'fps', parseInt(e.target.value))}
                             className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                           />
                           <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                              <span>5</span>
                              <span>60</span>
                           </div>
                        </div>

                         {/* Quality/Compression Control */}
                         <div className="space-y-3">
                           <div className="flex justify-between text-xs">
                             <label className="font-bold text-slate-400 uppercase tracking-wider">Compression Quality</label>
                             <span className="text-blue-400 font-mono">{config.quality}%</span>
                           </div>
                           <input 
                             type="range" 
                             min="10" 
                             max="100" 
                             step="10"
                             value={config.quality}
                             onChange={(e) => updateConfig(feed.id, 'quality', parseInt(e.target.value))}
                             className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                           />
                           <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                              <span>Low Bandwidth</span>
                              <span>Lossless</span>
                           </div>
                        </div>

                        <button 
                          onClick={() => setSettingsOpenId(null)}
                          className="w-full py-3 bg-green-600 hover:bg-green-500 text-white rounded-xl font-bold text-sm tracking-wide shadow-lg shadow-green-900/20 transition-all flex items-center justify-center gap-2"
                        >
                          <Check className="w-4 h-4" />
                          Apply Settings
                        </button>
                     </div>
                  </div>
               )}

               {/* Analyzing State */}
               {analyzingId === feed.id && (
                 <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center z-30 backdrop-blur-sm">
                   <div className="relative w-20 h-20 flex items-center justify-center">
                     <div className="absolute inset-0 border-4 border-blue-500/30 rounded-full animate-ping"></div>
                     <div className="absolute inset-0 border-4 border-t-blue-500 rounded-full animate-spin"></div>
                     <BrainCircuit className="w-8 h-8 text-blue-400" />
                   </div>
                   <p className="text-blue-200 text-sm mt-4 font-bold tracking-widest animate-pulse">ANALYZING SCENE</p>
                 </div>
               )}
            </div>

            {/* Controls */}
            <div className="p-3 bg-slate-900/95 border-t border-white/5 flex justify-between items-center backdrop-blur-md pointer-events-auto">
              <div className="flex gap-2">
                  <button 
                    onClick={() => handleAnalyze(feed)}
                    disabled={analyzingId === feed.id}
                    className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-[10px] uppercase font-bold tracking-wider rounded transition-all shadow-lg shadow-blue-900/50 hover:shadow-blue-500/40 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Target className="w-3.5 h-3.5" />
                    Analyze
                  </button>
                  <button 
                    onClick={() => setShowAiOverlay(!showAiOverlay)}
                    className={`flex items-center gap-2 px-3 py-1.5 text-[10px] uppercase font-bold tracking-wider rounded transition-colors border ${showAiOverlay ? 'bg-slate-800 text-green-400 border-green-500/30' : 'bg-transparent text-slate-500 border-slate-700 hover:text-slate-300'}`}
                  >
                    <Activity className="w-3.5 h-3.5" />
                    {showAiOverlay ? 'AI ON' : 'AI OFF'}
                  </button>
              </div>
              
              <div className="flex gap-1">
                <button 
                  onClick={() => setSettingsOpenId(feed.id)}
                  className={`p-1.5 hover:bg-white/10 rounded transition-colors ${settingsOpenId === feed.id ? 'text-blue-400 bg-white/5' : 'text-slate-400 hover:text-white'}`}
                  title="Stream Settings"
                >
                  <Settings className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => toggleFullscreen(feed.id)}
                  className="p-1.5 hover:bg-white/10 rounded text-slate-400 hover:text-white transition-colors"
                  title={fullscreenId === feed.id ? "Exit Fullscreen" : "Enter Fullscreen"}
                >
                  {fullscreenId === feed.id ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default LiveFeed;
