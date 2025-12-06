

import React, { useState } from 'react';
import { VenueZone, SafeRoute } from '../types';
import { MapPin, Navigation, Info, Users, AlertTriangle } from 'lucide-react';

interface VenueMapProps {
  zones: VenueZone[];
}

const VenueMap: React.FC<VenueMapProps> = ({ zones }) => {
  const [hoveredZone, setHoveredZone] = useState<VenueZone | null>(null);

  // Simulated safe routes for visualization
  const safeRoutes: SafeRoute[] = [
    { id: 'r1', fromZone: 'z1', toExit: 'Exit A', pathCoordinates: 'M 190 250 Q 250 300 700 250', status: 'recommended' },
    { id: 'r2', fromZone: 'z2', toExit: 'Main Entry', pathCoordinates: 'M 425 250 L 425 380', status: 'recommended' },
  ];

  const getZoneColor = (status: string) => {
    switch(status) {
      case 'critical': return 'fill-red-500/40 stroke-red-500';
      case 'warning': return 'fill-orange-500/40 stroke-orange-500';
      default: return 'fill-blue-500/20 stroke-blue-500';
    }
  };

  const getAiInsight = (zone: VenueZone) => {
    if (zone.status === 'critical') return "CRITICAL DENSITY: High crush risk detected. Immediate crowd dispersal advised via Exit A.";
    if (zone.status === 'warning') return "ELEVATED RISK: Inflow exceeds outflow. Deploy stewards to regulate entry.";
    return "NORMAL OPERATIONS: Flow within safety limits. No anomalies detected.";
  };

  return (
    <div className="glass p-6 rounded-2xl h-full flex flex-col relative overflow-hidden group/map">
      <div className="flex justify-between items-center mb-6 relative z-10">
        <div>
           <h3 className="text-lg font-bold text-white flex items-center gap-2">
             <MapPin className="w-5 h-5 text-blue-400" />
             Live Venue Map
           </h3>
           <p className="text-xs text-slate-400">Real-time occupancy & safe routes</p>
        </div>
        <div className="flex gap-3 text-[10px] font-medium uppercase tracking-wider">
           <div className="flex items-center gap-1.5 bg-slate-900/50 px-2 py-1 rounded border border-white/5">
             <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
             <span className="text-slate-300">Safe</span>
           </div>
           <div className="flex items-center gap-1.5 bg-slate-900/50 px-2 py-1 rounded border border-white/5">
             <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></span>
             <span className="text-slate-300">Warn</span>
           </div>
           <div className="flex items-center gap-1.5 bg-slate-900/50 px-2 py-1 rounded border border-white/5">
             <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
             <span className="text-slate-300">Crit</span>
           </div>
        </div>
      </div>

      <div className="relative flex-1 bg-slate-900/80 rounded-xl border border-white/5 overflow-hidden shadow-inner">
        {/* Grid Background */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px]"></div>

        <svg viewBox="0 0 800 500" className="w-full h-full p-4 md:p-8 drop-shadow-[0_0_20px_rgba(0,0,0,0.6)]">
          <defs>
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            <marker id="navArrow" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
              <path d="M0,0 L0,6 L6,3 z" fill="#22c55e" />
            </marker>
          </defs>

          {/* Stadium Perimeter */}
          <path d="M 100 100 L 700 100 L 750 250 L 700 400 L 100 400 L 50 250 Z" 
                className="fill-slate-800 stroke-slate-600 stroke-2" />
          
          {/* Stage */}
          <rect x="50" y="180" width="60" height="140" className="fill-purple-900 stroke-purple-500 stroke-2" />
          <text x="80" y="250" className="fill-purple-200 text-[12px] font-bold rotate-[-90deg] text-anchor-middle">MAIN STAGE</text>

          {/* Render Zones */}
          {zones.map((zone) => (
            <g 
              key={zone.id} 
              className="group cursor-pointer transition-all duration-300"
              onMouseEnter={() => setHoveredZone(zone)}
              onMouseLeave={() => setHoveredZone(null)}
            >
              <rect
                x={zone.coordinates.x}
                y={zone.coordinates.y}
                width={zone.coordinates.width}
                height={zone.coordinates.height}
                rx="8"
                className={`transition-all duration-500 stroke-[2px] ${getZoneColor(zone.status)} group-hover:opacity-80`}
                filter={zone.status === 'critical' ? 'url(#glow)' : ''}
              />
              
              {/* Occupancy Indicator */}
              <circle cx={zone.coordinates.x + zone.coordinates.width/2} cy={zone.coordinates.y + zone.coordinates.height/2} r="20" className="fill-black/60 backdrop-blur-sm" />
              <text 
                x={zone.coordinates.x + zone.coordinates.width/2} 
                y={zone.coordinates.y + zone.coordinates.height/2 + 5} 
                textAnchor="middle" 
                className={`text-[12px] font-bold pointer-events-none ${zone.status === 'critical' ? 'fill-red-400' : 'fill-white'}`}
              >
                {zone.occupancy}%
              </text>
              
              {/* Zone Label */}
              <text x={zone.coordinates.x + 10} y={zone.coordinates.y + 20} className="fill-white/70 text-[10px] uppercase font-bold tracking-wider">{zone.name}</text>
            </g>
          ))}

          {/* Safe Routes Animation */}
          {safeRoutes.map(route => (
            <g key={route.id} className="opacity-60 group-hover/map:opacity-100 transition-opacity duration-300">
               <path 
                 d={route.pathCoordinates} 
                 className="fill-none stroke-green-500/30 stroke-[4px]" 
                 strokeDasharray="8 4"
               />
               <path 
                 d={route.pathCoordinates} 
                 className="fill-none stroke-green-400 stroke-[2px] animate-dash" 
                 strokeDasharray="8 4"
               />
               <circle r="4" className="fill-green-500 animate-ping">
                  <animateMotion dur="2s" repeatCount="indefinite" path={route.pathCoordinates} />
               </circle>
            </g>
          ))}

          {/* Exits */}
          <g transform="translate(710, 240)">
             <text x="0" y="0" className="fill-green-400 text-xs font-bold">EXIT A</text>
             <rect x="-5" y="5" width="40" height="20" className="fill-none stroke-green-500" />
          </g>

          {/* AI Analysis Tooltip inside SVG using foreignObject */}
          {hoveredZone && (
             <foreignObject 
               x={hoveredZone.coordinates.x + hoveredZone.coordinates.width/2 - 100} 
               y={hoveredZone.coordinates.y - 120} 
               width="200" 
               height="110"
               className="overflow-visible pointer-events-none"
             >
                <div className={`bg-slate-900/90 backdrop-blur-md rounded-xl p-3 border shadow-2xl animate-in zoom-in-95 duration-200 ${
                  hoveredZone.status === 'critical' ? 'border-red-500/50 shadow-red-900/20' : 
                  hoveredZone.status === 'warning' ? 'border-orange-500/50 shadow-orange-900/20' : 
                  'border-blue-500/50 shadow-blue-900/20'
                }`}>
                   <div className="flex items-center justify-between mb-2 pb-2 border-b border-white/10">
                      <h4 className="font-bold text-white text-xs uppercase tracking-wider">{hoveredZone.name}</h4>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                         hoveredZone.status === 'critical' ? 'bg-red-500 text-white' : 
                         hoveredZone.status === 'warning' ? 'bg-orange-500 text-white' : 
                         'bg-green-500 text-white'
                      }`}>{hoveredZone.status.toUpperCase()}</span>
                   </div>
                   
                   <div className="flex items-start gap-2">
                      <div className="mt-0.5">
                         {hoveredZone.status === 'critical' ? <AlertTriangle className="w-3 h-3 text-red-400" /> : <Info className="w-3 h-3 text-blue-400" />}
                      </div>
                      <div>
                         <p className="text-[9px] text-slate-300 leading-tight font-medium mb-1">AI ANALYSIS:</p>
                         <p className="text-[9px] text-slate-400 leading-tight">
                           {getAiInsight(hoveredZone)}
                         </p>
                      </div>
                   </div>

                   {/* Tip Arrow */}
                   <div className="absolute left-1/2 -bottom-2 -translate-x-1/2 w-4 h-4 bg-slate-900 border-r border-b border-slate-700 transform rotate-45"></div>
                </div>
             </foreignObject>
          )}
          
        </svg>

        {/* Legend / Info Overlay */}
        <div className="absolute bottom-4 left-4 p-3 bg-black/60 backdrop-blur-md rounded-lg border border-white/10 text-xs text-slate-300 pointer-events-none">
           <div className="flex items-center gap-2 mb-1">
             <Navigation className="w-3 h-3 text-green-400" />
             <span className="text-green-400 font-bold">Recommended Evac Path</span>
           </div>
           <p className="opacity-70 text-[10px]">AI Dynamic Routing Active</p>
        </div>
      </div>
    </div>
  );
};

export default VenueMap;
