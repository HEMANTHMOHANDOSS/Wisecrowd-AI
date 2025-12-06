import React, { useEffect, useRef, useState } from 'react';
import { Event } from '../types';
import { MapPin, Users, Activity, Globe, Map as MapIcon, ChevronRight, ChevronLeft, Building2 } from 'lucide-react';

interface GlobalMapProps {
  events: Event[];
  onSelectEvent: (event: Event) => void;
}

type MapMode = 'GLOBAL' | 'INDIA' | 'CITY';

const CITIES = [
  { name: 'Chennai', lat: 13.0827, lng: 80.2707 },
  { name: 'Trichy', lat: 10.7905, lng: 78.6930 },
  { name: 'Madurai', lat: 9.9252, lng: 78.1198 },
  { name: 'Coimbatore', lat: 11.0168, lng: 76.9558 },
  { name: 'Bangalore', lat: 12.9716, lng: 77.5946 },
  { name: 'Pune', lat: 18.5204, lng: 73.8567 },
  { name: 'Hyderabad', lat: 17.3850, lng: 78.4867 },
  { name: 'Delhi', lat: 28.6139, lng: 77.2090 },
];

const GlobalMap: React.FC<GlobalMapProps> = ({ events, onSelectEvent }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const [mapMode, setMapMode] = useState<MapMode>('GLOBAL');
  const [selectedCity, setSelectedCity] = useState<string | null>(null);

  // Initialize Map
  useEffect(() => {
    if (!mapContainer.current || mapInstance.current) return;

    if ((window as any).L) {
      const L = (window as any).L;
      
      const map = L.map(mapContainer.current, {
        center: [20, 0],
        zoom: 2,
        zoomControl: false,
        attributionControl: false
      });

      // Dark Mode Tiles
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap',
        subdomains: 'abcd',
        maxZoom: 19
      }).addTo(map);

      mapInstance.current = map;
    }

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, []);

  // Handle Markers
  useEffect(() => {
    if (!mapInstance.current || !(window as any).L) return;
    const map = mapInstance.current;
    const L = (window as any).L;

    // Clear existing layers
    map.eachLayer((layer: any) => {
      if (layer instanceof L.Marker) {
        map.removeLayer(layer);
      }
    });

    const createIcon = (riskScore: number) => {
      const color = riskScore > 75 ? '#ef4444' : riskScore > 50 ? '#f59e0b' : '#3b82f6';
      return L.divIcon({
        className: 'custom-pin',
        html: `<div style="background-color: ${color}; width: 12px; height: 12px; border-radius: 50%; box-shadow: 0 0 10px ${color}; border: 2px solid white;"></div>`,
        iconSize: [12, 12],
        iconAnchor: [6, 6]
      });
    };

    // Filter events: 
    // If in GLOBAL: show all
    // If in INDIA: show only india events
    // If in CITY: show only events in that city
    let visibleEvents = events;
    if (mapMode === 'CITY' && selectedCity) {
      visibleEvents = events.filter(e => e.location.address.includes(selectedCity));
    }

    visibleEvents.forEach((event) => {
      const marker = L.marker([event.location.lat, event.location.lng], {
        icon: createIcon(event.riskScore)
      }).addTo(map);

      const popupContent = document.createElement('div');
      popupContent.innerHTML = `
        <div class="p-1 min-w-[200px]">
          <h3 class="font-bold text-sm mb-1">${event.name}</h3>
          <p class="text-xs text-gray-300 mb-2">${event.location.address}</p>
          <div class="flex items-center gap-2 text-xs mb-2">
            <span class="font-mono text-blue-400">${event.attendees.toLocaleString()} ppl</span>
            <span class="font-mono ${event.riskScore > 50 ? 'text-red-400' : 'text-green-400'}">Risk: ${event.riskScore}</span>
          </div>
          <button id="btn-${event.id}" class="w-full bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold py-1.5 rounded transition-colors">
            Monitor Event
          </button>
        </div>
      `;

      marker.bindPopup(popupContent);
      marker.on('popupopen', () => {
        const btn = document.getElementById(`btn-${event.id}`);
        if (btn) {
          btn.onclick = () => onSelectEvent(event);
        }
      });
    });

  }, [events, onSelectEvent, mapMode, selectedCity]);

  // Handle View Transitions
  useEffect(() => {
    if (!mapInstance.current) return;
    const map = mapInstance.current;

    if (mapMode === 'CITY' && selectedCity) {
      const city = CITIES.find(c => c.name === selectedCity);
      if (city) {
        map.flyTo([city.lat, city.lng], 13, { duration: 2 });
      }
    } else if (mapMode === 'INDIA') {
      map.flyTo([20.5937, 78.9629], 5, { duration: 2 });
    } else {
      map.flyTo([20, 0], 2, { duration: 2 });
    }
  }, [mapMode, selectedCity]);

  const handleCitySelect = (cityName: string) => {
    setSelectedCity(cityName);
    setMapMode('CITY');
  };

  const handleBackToIndia = () => {
    setSelectedCity(null);
    setMapMode('INDIA');
  };

  // Determine list content based on mode
  const renderSidebarContent = () => {
    if (mapMode === 'GLOBAL' || mapMode === 'INDIA') {
      if (mapMode === 'INDIA') {
        return (
          <>
            <h2 className="text-xs font-bold text-white uppercase tracking-wider mb-3 flex items-center gap-2">
              <MapIcon className="w-4 h-4 text-blue-400" /> Select Region
            </h2>
            <div className="overflow-y-auto custom-scrollbar space-y-1 pr-1 flex-1">
              {CITIES.map(city => (
                <button 
                  key={city.name}
                  onClick={() => handleCitySelect(city.name)}
                  className="w-full text-left px-3 py-3 rounded-lg text-sm font-medium transition-colors flex justify-between items-center bg-slate-800/50 border border-white/5 hover:bg-slate-700/50 hover:border-blue-500/30 group"
                >
                  <span className="group-hover:text-white text-slate-300">{city.name}</span>
                  <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-blue-400" />
                </button>
              ))}
            </div>
          </>
        );
      } 
      // GLOBAL mode - maybe show top events list or nothing specific
      return (
        <div className="flex flex-col items-center justify-center h-full text-slate-500 text-xs">
          <Globe className="w-8 h-8 mb-2 opacity-50" />
          <p>Select 'India Map' to view regional events</p>
        </div>
      );
    } 

    if (mapMode === 'CITY' && selectedCity) {
      const cityEvents = events.filter(e => e.location.address.includes(selectedCity));
      return (
        <>
          <button 
            onClick={handleBackToIndia}
            className="mb-4 flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white transition-colors"
          >
            <ChevronLeft className="w-4 h-4" /> Back to Country
          </button>
          
          <h2 className="text-xs font-bold text-white uppercase tracking-wider mb-3 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-blue-400" /> Events in {selectedCity}
          </h2>

          <div className="overflow-y-auto custom-scrollbar space-y-3 pr-1 flex-1">
             {cityEvents.length > 0 ? cityEvents.map(event => (
               <button 
                 key={event.id}
                 onClick={() => {
                   if (mapInstance.current) {
                     mapInstance.current.flyTo([event.location.lat, event.location.lng], 15, { duration: 1 });
                   }
                 }}
                 className="w-full text-left p-3 rounded-xl bg-slate-800/50 hover:bg-slate-700/50 border border-white/5 hover:border-blue-500/30 transition-all group"
               >
                 <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-slate-200 text-sm group-hover:text-blue-400 transition-colors">{event.name}</h3>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${event.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-slate-600/20 text-slate-400'}`}>
                      {event.status.toUpperCase()}
                    </span>
                 </div>
                 <div className="flex items-center gap-4 text-xs text-slate-400">
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" /> {event.attendees.toLocaleString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <Activity className="w-3 h-3" /> Risk: {event.riskScore}
                    </span>
                 </div>
                 <div className="mt-2 text-[10px] text-slate-500 flex items-center gap-1">
                   <MapPin className="w-3 h-3" /> {event.location.address.split(',')[0]}
                 </div>
               </button>
             )) : (
               <div className="text-center py-8 text-slate-500 text-xs">
                  No active events listed for {selectedCity}.
               </div>
             )}
          </div>
        </>
      );
    }
  };

  return (
    <div className="relative w-full h-screen bg-slate-950 overflow-hidden flex flex-col">
       {/* Header Overlay */}
       <div className="absolute top-0 left-0 right-0 z-[1000] p-6 bg-gradient-to-b from-slate-900 via-slate-900/80 to-transparent pointer-events-none">
          <div className="flex justify-between items-start">
             <div>
                <h1 className="text-3xl font-bold text-white tracking-tight drop-shadow-lg">Global Command Center</h1>
                <p className="text-blue-300 text-sm font-medium tracking-wide uppercase mt-1">WiseCrowd AI - Powered by WiseCrew Solutions</p>
             </div>
             
             {/* Map Mode Toggle */}
             <div className="pointer-events-auto flex bg-slate-800/80 backdrop-blur rounded-xl p-1 border border-white/10">
                <button 
                  onClick={() => { setMapMode('GLOBAL'); setSelectedCity(null); }}
                  className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all ${mapMode === 'GLOBAL' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                >
                  <Globe className="w-4 h-4" /> Global View
                </button>
                <button 
                  onClick={() => { setMapMode('INDIA'); setSelectedCity(null); }}
                  className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all ${mapMode === 'INDIA' || mapMode === 'CITY' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                >
                  <MapIcon className="w-4 h-4" /> India Map
                </button>
             </div>
          </div>
       </div>

       {/* Map Container */}
       <div ref={mapContainer} className="flex-1 w-full h-full z-0 relative" />

       {/* Sidebar Container */}
       <div className="absolute top-24 bottom-6 left-6 w-80 z-[1000] pointer-events-none hidden lg:flex flex-col gap-4">
          <div className="flex-1 glass rounded-2xl p-4 overflow-hidden flex flex-col pointer-events-auto border border-white/5 shadow-2xl">
             {renderSidebarContent()}
          </div>
       </div>

       {/* Legend */}
       <div className="absolute bottom-6 right-6 z-[1000] glass px-4 py-3 rounded-xl border border-white/5 pointer-events-auto">
          <div className="space-y-2 text-xs font-medium">
             <div className="flex items-center gap-2">
               <div className="w-3 h-3 rounded-full bg-blue-500 shadow-[0_0_10px_#3b82f6]"></div>
               <span className="text-slate-300">Low Risk</span>
             </div>
             <div className="flex items-center gap-2">
               <div className="w-3 h-3 rounded-full bg-amber-500 shadow-[0_0_10px_#f59e0b]"></div>
               <span className="text-slate-300">Moderate Risk</span>
             </div>
             <div className="flex items-center gap-2">
               <div className="w-3 h-3 rounded-full bg-red-500 shadow-[0_0_10px_#ef4444]"></div>
               <span className="text-slate-300">Critical Risk</span>
             </div>
          </div>
       </div>
    </div>
  );
};

export default GlobalMap;