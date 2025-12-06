
import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import LiveFeed from './components/LiveFeed';
import StatsCard from './components/StatsCard';
import Analytics from './components/Analytics';
import AlertsPanel from './components/AlertsPanel';
import VenueMap from './components/VenueMap';
import Login from './components/Login';
import AdminPanel from './components/AdminPanel';
import GlobalMap from './components/GlobalMap';
import { ViewState, CameraFeed, Alert, CrowdMetric, VenueZone, Detection, SoundSettings, Event, User, UserRole } from './types';
import { Users, AlertCircle, TrendingUp, Brain, Megaphone, Shield, BrainCircuit } from 'lucide-react';
import { analyzeCrowdData } from './services/geminiService';

// --- MOCK DATA ---
const INITIAL_USERS: User[] = [
  { id: 'u1', username: 'admin', password: 'admin123', role: 'admin', email: 'admin@wisecrowd.ai', status: 'active' },
  { id: 'u2', username: 'user', password: 'user123', role: 'viewer', email: 'viewer@wisecrowd.ai', status: 'active' },
];

const INITIAL_EVENTS: Event[] = [
  // Global Events
  { 
    id: 'evt-1', 
    name: 'Neon City Festival', 
    location: { lat: 36.1699, lng: -115.1398, address: 'Las Vegas, NV' }, 
    status: 'active', 
    attendees: 12450, 
    riskScore: 65, 
    startTime: '2025-10-15T18:00:00' 
  },
  { 
    id: 'evt-2', 
    name: 'Wembley Cup Final', 
    location: { lat: 51.5560, lng: -0.2796, address: 'London, UK' }, 
    status: 'scheduled', 
    attendees: 0, 
    riskScore: 10, 
    startTime: '2025-12-10T14:00:00' 
  },
  
  // Chennai Events
  { 
    id: 'evt-in-1', 
    name: 'Chennai Music Season', 
    location: { lat: 13.0827, lng: 80.2707, address: 'Music Academy, Chennai, TN' }, 
    status: 'active', 
    attendees: 5200, 
    riskScore: 45, 
    startTime: '2025-11-05T17:00:00' 
  },
  { 
    id: 'evt-in-1b', 
    name: 'Marina Beach Air Show', 
    location: { lat: 13.0500, lng: 80.2824, address: 'Marina Beach, Chennai, TN' }, 
    status: 'active', 
    attendees: 45000, 
    riskScore: 88, 
    startTime: '2025-11-05T10:00:00' 
  },
  { 
    id: 'evt-in-1c', 
    name: 'Phoenix Mall Expo', 
    location: { lat: 12.9915, lng: 80.2168, address: 'Velachery, Chennai, TN' }, 
    status: 'active', 
    attendees: 3200, 
    riskScore: 30, 
    startTime: '2025-11-05T09:00:00' 
  },

  // Trichy
  { 
    id: 'evt-in-2', 
    name: 'Rockfort Expo', 
    location: { lat: 10.8290, lng: 78.6930, address: 'Chatram, Trichy, TN' }, 
    status: 'active', 
    attendees: 3100, 
    riskScore: 25, 
    startTime: '2025-11-06T10:00:00' 
  },
  { 
    id: 'evt-in-2b', 
    name: 'Srirangam Temple Fest', 
    location: { lat: 10.8623, lng: 78.6876, address: 'Srirangam, Trichy, TN' }, 
    status: 'active', 
    attendees: 12000, 
    riskScore: 65, 
    startTime: '2025-11-06T06:00:00' 
  },

  // Madurai
  { 
    id: 'evt-in-3', 
    name: 'Chithirai Festival', 
    location: { lat: 9.9252, lng: 78.1198, address: 'Meenakshi Temple, Madurai, TN' }, 
    status: 'active', 
    attendees: 15000, 
    riskScore: 82, 
    startTime: '2025-11-07T06:00:00' 
  },

  // Coimbatore
  { 
    id: 'evt-in-4', 
    name: 'Tech Coimbatore', 
    location: { lat: 11.0168, lng: 76.9558, address: 'Codissia, Coimbatore, TN' }, 
    status: 'scheduled', 
    attendees: 0, 
    riskScore: 5, 
    startTime: '2025-12-01T09:00:00' 
  },

  // Bangalore
  { 
    id: 'evt-in-5', 
    name: 'Bangalore Tech Summit', 
    location: { lat: 12.9716, lng: 77.5946, address: 'Palace Grounds, Bangalore, KA' }, 
    status: 'active', 
    attendees: 8500, 
    riskScore: 35, 
    startTime: '2025-11-10T09:00:00' 
  },
  { 
    id: 'evt-in-5b', 
    name: 'Lalbagh Flower Show', 
    location: { lat: 12.9507, lng: 77.5848, address: 'Lalbagh, Bangalore, KA' }, 
    status: 'active', 
    attendees: 22000, 
    riskScore: 70, 
    startTime: '2025-11-10T08:00:00' 
  },

  // Pune
  { 
    id: 'evt-in-6', 
    name: 'Pune Cultural Fest', 
    location: { lat: 18.5204, lng: 73.8567, address: 'Shaniwar Wada, Pune, MH' }, 
    status: 'active', 
    attendees: 4200, 
    riskScore: 28, 
    startTime: '2025-11-12T16:00:00' 
  },

  // Hyderabad
  { 
    id: 'evt-in-7', 
    name: 'Hyderabad Sunburn', 
    location: { lat: 17.3850, lng: 78.4867, address: 'Hitech City, Hyderabad, TS' }, 
    status: 'active', 
    attendees: 12000, 
    riskScore: 75, 
    startTime: '2025-11-15T19:00:00' 
  },

  // Delhi
  { 
    id: 'evt-in-8', 
    name: 'Delhi Trade Fair', 
    location: { lat: 28.6139, lng: 77.2090, address: 'Pragati Maidan, Delhi, NCR' }, 
    status: 'active', 
    attendees: 25000, 
    riskScore: 60, 
    startTime: '2025-11-20T10:00:00' 
  }
];

const MOCK_FEEDS: CameraFeed[] = [
  { 
    id: 'cam-1', 
    name: 'Main Gate Entrance', 
    location: 'Sector A', 
    status: 'active', 
    currentCount: 142, 
    capacity: 500, 
    riskLevel: 'low', 
    imageUrl: 'https://images.unsplash.com/photo-1531058020387-3be344556be6?auto=format&fit=crop&q=80&w=1000' 
  },
  { 
    id: 'cam-2', 
    name: 'Stage Front Left', 
    location: 'Sector B', 
    status: 'active', 
    currentCount: 850, 
    capacity: 1000, 
    riskLevel: 'high', 
    imageUrl: 'https://images.unsplash.com/photo-1459749411177-287ce379c192?auto=format&fit=crop&q=80&w=1000' 
  },
  { 
    id: 'cam-3', 
    name: 'VIP Lounge Access', 
    location: 'Sector C', 
    status: 'active', 
    currentCount: 45, 
    capacity: 200, 
    riskLevel: 'low', 
    imageUrl: 'https://images.unsplash.com/photo-1560439514-e960a3ef5019?auto=format&fit=crop&q=80&w=1000' 
  },
  { 
    id: 'cam-4', 
    name: 'Food Court Corridor', 
    location: 'Sector D', 
    status: 'warning', 
    currentCount: 320, 
    capacity: 400, 
    riskLevel: 'moderate', 
    imageUrl: 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&q=80&w=1000' 
  }
];

const MOCK_ZONES: VenueZone[] = [
  { id: 'z1', name: 'Main Stage', capacity: 2000, occupancy: 85, coordinates: { x: 150, y: 150, width: 200, height: 150 }, status: 'critical' },
  { id: 'z2', name: 'Food Court', capacity: 500, occupancy: 45, coordinates: { x: 450, y: 150, width: 150, height: 100 }, status: 'safe' },
  { id: 'z3', name: 'Entrance Hall', capacity: 800, occupancy: 60, coordinates: { x: 150, y: 320, width: 450, height: 60 }, status: 'warning' },
];

const GENERATE_MOCK_METRICS = (count = 20): CrowdMetric[] => {
  const metrics: CrowdMetric[] = [];
  const now = new Date();
  for (let i = count; i > 0; i--) {
    const time = new Date(now.getTime() - i * 60000);
    metrics.push({
      time: time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      count: 1200 + Math.floor(Math.random() * 500),
      density: 2 + Math.random(),
      flowRate: 40 + Math.floor(Math.random() * 20),
      predictedCount: 1300 + Math.floor(Math.random() * 600),
      riskScore: 30 + Math.floor(Math.random() * 50)
    });
  }
  return metrics;
};

const MOCK_ALERTS: Alert[] = [
  { id: 'a1', severity: 'high', title: 'Overcrowding Detected', message: 'Density exceeds safe limits in Sector B (Stage Front).', timestamp: new Date().toISOString(), location: 'Sector B', resolved: false, type: 'density' },
  { id: 'a2', severity: 'medium', title: 'Flow Obstruction', message: 'Stationary crowd detected near Food Court exit.', timestamp: new Date(Date.now() - 300000).toISOString(), location: 'Sector D', resolved: false, type: 'flow' }
];

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<ViewState>(ViewState.GLOBAL_MAP);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  
  // Real-time State
  const [users, setUsers] = useState<User[]>(INITIAL_USERS);
  const [events, setEvents] = useState<Event[]>(INITIAL_EVENTS);
  const [metrics, setMetrics] = useState<CrowdMetric[]>(GENERATE_MOCK_METRICS());
  const [feeds, setFeeds] = useState<CameraFeed[]>(MOCK_FEEDS);
  const [zones, setZones] = useState<VenueZone[]>(MOCK_ZONES);
  const [alerts, setAlerts] = useState<Alert[]>(MOCK_ALERTS);
  const [detections, setDetections] = useState<Record<string, Detection[]>>({});
  
  // App Settings
  const [soundSettings, setSoundSettings] = useState<SoundSettings>(() => {
    const saved = localStorage.getItem('crowdsafe_sound_settings');
    return saved ? JSON.parse(saved) : { enabled: true, volume: 0.5 };
  });

  // UI State
  const [aiReport, setAiReport] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  
  const isConnected = true;

  // Persist Settings
  useEffect(() => {
    localStorage.setItem('crowdsafe_sound_settings', JSON.stringify(soundSettings));
  }, [soundSettings]);

  // --- Mock Data Simulation ---
  useEffect(() => {
    if (!isAuthenticated || !selectedEvent) return;

    // 1. Metrics Update Loop
    const metricsInterval = setInterval(() => {
      setMetrics(prev => {
        const last = prev[prev.length - 1];
        const now = new Date();
        const newMetric: CrowdMetric = {
          time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          count: Math.max(0, last.count + (Math.random() - 0.5) * 50),
          density: Math.max(0, last.density + (Math.random() - 0.5) * 0.2),
          flowRate: Math.max(0, last.flowRate + (Math.random() - 0.5) * 5),
          predictedCount: last.count + (Math.random() - 0.4) * 100,
          riskScore: Math.min(100, Math.max(0, last.riskScore + (Math.random() - 0.5) * 10))
        };
        return [...prev.slice(1), newMetric];
      });

      // Update Zone Occupancy
      setZones(prev => prev.map(z => {
         const newOccupancy = Math.min(100, Math.max(0, z.occupancy + Math.floor((Math.random() - 0.5) * 5)));
         let newStatus: VenueZone['status'] = 'safe';
         if (newOccupancy > 85) newStatus = 'critical';
         else if (newOccupancy > 60) newStatus = 'warning';
         return { ...z, occupancy: newOccupancy, status: newStatus };
      }));
    }, 3000);

    // 2. Detection Animation
    const detectionInterval = setInterval(() => {
       const newDetections: Record<string, Detection[]> = {};
       feeds.forEach(feed => {
         const count = Math.floor(Math.random() * 4) + 1;
         newDetections[feed.id] = Array.from({ length: count }).map((_, i) => ({
           id: i,
           x: Math.random() * 80,
           y: Math.random() * 70,
           w: 10 + Math.random() * 10,
           h: 20 + Math.random() * 20,
           label: Math.random() > 0.7 ? 'group' : 'person',
           confidence: 0.75 + Math.random() * 0.2,
           color: Math.random() > 0.5 ? '#3b82f6' : '#ef4444'
         }));
       });
       setDetections(newDetections);
    }, 800);

    return () => {
      clearInterval(metricsInterval);
      clearInterval(detectionInterval);
    };
  }, [feeds, isAuthenticated, selectedEvent]);

  // Auth Handlers
  const handleLogin = (username: string, passwordAttempt: string) => {
    const user = users.find(u => u.username === username && u.password === passwordAttempt);
    if (user) {
      setCurrentUser(user);
      setIsAuthenticated(true);
      setCurrentView(ViewState.GLOBAL_MAP);
    } else {
      alert("Invalid credentials. Try admin/admin123 or user/user123");
    }
  };

  const handleRegister = (username: string, email: string, password: string): boolean => {
    if (users.some(u => u.username === username)) {
      return false;
    }
    const newUser: User = {
      id: `u-${Date.now()}`,
      username,
      email,
      password,
      role: 'viewer', // Default role for self-registration
      status: 'active',
      lastLogin: 'Never'
    };
    setUsers([...users, newUser]);
    return true;
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentUser(null);
    setSelectedEvent(null);
  };

  const handleResolveAlert = (id: string) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, resolved: true } : a));
  };

  const handleGenerateReport = async () => {
    setIsAiLoading(true);
    setAiReport(null);
    try {
      const report = await analyzeCrowdData(metrics, alerts);
      setAiReport(report);
    } catch (e) {
      console.warn("AI Generation failed, using mock report.");
      setTimeout(() => {
        setAiReport(`## TACTICAL SAFETY REPORT (DEMO MODE)
        
### 1. Risk Assessment: **HIGH**
Current crowd density in Sector B is approaching critical limits. Anomaly detection indicates a bottleneck formation near the East Exit.

### 2. Identified Hazards
- **Sector B (Stage Front):** Density > 4 ppl/m². High risk of crushing.
- **Sector D:** Flow rate has dropped by 15% in the last 5 minutes.

### 3. Tactical Recommendations
1.  **IMMEDIATE:** Open auxiliary exit gates B2 and B3 to relieve pressure on Sector B.
2.  **DEPLOY:** Send response team Alpha to Sector D to clear the obstruction.
3.  **ANNOUNCE:** Use PA system to direct crowd towards the North Food Court (Sector C).`);
      }, 1500);
    } finally {
      if (process.env.API_KEY) setIsAiLoading(false);
      else setTimeout(() => setIsAiLoading(false), 1500);
    }
  };

  const handleSelectEvent = (event: Event) => {
    setSelectedEvent(event);
    setCurrentView(ViewState.DASHBOARD);
  };

  const handleSwitchEvent = () => {
    setSelectedEvent(null);
    setCurrentView(ViewState.GLOBAL_MAP);
  };

  // Admin Actions
  const handleAddEvent = (newEvent: Event) => {
    setEvents(prev => [...prev, newEvent]);
  };

  const handleDeleteEvent = (eventId: string) => {
    setEvents(prev => prev.filter(e => e.id !== eventId));
  };

  const handleAddUser = (newUser: User) => {
    setUsers(prev => [...prev, newUser]);
  };

  const handleDeleteUser = (userId: string) => {
    setUsers(prev => prev.filter(u => u.id !== userId));
  };

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} onRegister={handleRegister} />;
  }

  // GLOBAL MAP VIEW
  if (!selectedEvent || currentView === ViewState.GLOBAL_MAP) {
    return (
      <GlobalMap events={events} onSelectEvent={handleSelectEvent} />
    );
  }

  // EVENT DASHBOARD VIEW
  const latestMetric = metrics.length > 0 ? metrics[metrics.length - 1] : { count: 0, riskScore: 0, flowRate: 0 };
  const totalCapacity = feeds.reduce((acc, feed) => acc + feed.capacity, 0) || 1;
  const totalCount = feeds.reduce((acc, feed) => acc + feed.currentCount, 0);

  return (
    <div className="flex min-h-screen bg-black text-slate-200 font-sans selection:bg-blue-500/30">
      <div className="fixed inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none z-0"></div>
      
      <Sidebar 
        currentView={currentView} 
        onViewChange={setCurrentView} 
        soundSettings={soundSettings}
        onSoundSettingsChange={setSoundSettings}
        onLogout={handleLogout}
        onSwitchEvent={handleSwitchEvent}
        eventName={selectedEvent.name}
        userRole={currentUser?.role || 'viewer'}
        userName={currentUser?.username || 'User'}
      />

      <main className="ml-64 flex-1 p-8 relative z-10 max-w-[1920px] mx-auto">
        {/* Top Header */}
        <header className="flex justify-between items-end mb-10 pb-4 border-b border-white/5">
          <div>
            <h2 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
              {currentView === ViewState.DASHBOARD && "Command Center"}
              {currentView === ViewState.MAP && "Live Venue Map"}
              {currentView === ViewState.ANALYTICS && "Predictive Analytics"}
              {currentView === ViewState.ALERTS && "Risk Alerts"}
              {currentView === ViewState.SETTINGS && "System Settings"}
              {currentView === ViewState.ADMIN && "System Configuration"}
              <div className={`flex items-center gap-1.5 text-xs font-mono font-normal px-2 py-1 rounded border ${isConnected ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'} animate-pulse`}></span>
                {isConnected ? 'ONLINE' : 'OFFLINE'}
              </div>
            </h2>
            <p className="text-slate-400 text-sm mt-1">Real-time crowd safety prediction & monitoring</p>
          </div>
          
          <div className="flex gap-4">
             <button 
               onClick={handleGenerateReport}
               disabled={isAiLoading}
               className="group relative px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold shadow-lg shadow-blue-500/25 transition-all hover:shadow-blue-500/40 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed overflow-hidden"
             >
               <div className="absolute inset-0 bg-white/20 group-hover:translate-x-full transition-transform duration-700 -skew-x-12"></div>
               <div className="flex items-center gap-2 relative z-10">
                 {isAiLoading ? (
                   <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                 ) : (
                   <Brain className="w-5 h-5" />
                 )}
                 {isAiLoading ? 'Generating...' : 'Generate AI Report'}
               </div>
             </button>
          </div>
        </header>

        {/* Dynamic View Rendering */}
        <div className="animate-in fade-in duration-500">
          
          {currentView === ViewState.DASHBOARD && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatsCard 
                  label="Total Attendance" 
                  value={totalCount.toLocaleString()} 
                  change="Live" 
                  isPositive={true} 
                  icon={Users} 
                  color="blue"
                  subtext={`${Math.round((totalCount / totalCapacity) * 100)}% of Capacity`}
                />
                <StatsCard 
                  label="Crowd Risk Score" 
                  value={Math.round(latestMetric.riskScore)} 
                  change={latestMetric.riskScore > 50 ? "Rising" : "Stable"} 
                  isPositive={latestMetric.riskScore < 50} 
                  icon={Shield} 
                  color={latestMetric.riskScore > 70 ? "red" : latestMetric.riskScore > 40 ? "amber" : "green"}
                  subtext="AI Calculated Safety Index"
                />
                <StatsCard 
                  label="Flow Rate" 
                  value={`${Math.round(latestMetric.flowRate)} /min`}
                  change="Real-time"
                  isPositive={true} 
                  icon={TrendingUp} 
                  color="purple"
                  subtext="Avg Movement Speed"
                />
                <StatsCard 
                  label="Critical Zones" 
                  value={zones.filter(z => z.status === 'critical').length} 
                  icon={AlertCircle} 
                  color="red"
                  subtext="Immediate Attention Required"
                />
              </div>

              <div className="grid grid-cols-1 2xl:grid-cols-3 gap-8">
                <div className="2xl:col-span-2 space-y-8">
                  <LiveFeed feeds={feeds} detections={detections} onTriggerAnalysis={setAiReport} />
                  <Analytics data={metrics} />
                </div>
                <div className="2xl:col-span-1 space-y-8">
                  <div className="h-[400px] w-full">
                    <VenueMap zones={zones} />
                  </div>
                  
                  <div className="glass p-6 rounded-2xl">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                      <Megaphone className="w-5 h-5 text-yellow-400" />
                      Safety Actions
                    </h3>
                    <div className="space-y-3">
                        <div className="p-3 bg-slate-900/50 border border-white/5 rounded-lg flex gap-3 hover:bg-slate-800 transition-colors cursor-pointer">
                          <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold text-xs">1</div>
                          <div>
                              <p className="text-sm font-medium text-slate-200">Open Exit B Gates</p>
                              <p className="text-xs text-slate-500">Predicted surge in Zone A in 5m</p>
                          </div>
                        </div>
                    </div>
                  </div>

                  <AlertsPanel alerts={alerts} onResolve={handleResolveAlert} soundSettings={soundSettings} />
                </div>
              </div>
            </div>
          )}

          {currentView === ViewState.MAP && (
            <div className="h-[80vh]">
              <VenueMap zones={zones} />
            </div>
          )}

          {currentView === ViewState.ANALYTICS && (
            <Analytics data={metrics} />
          )}

          {currentView === ViewState.ADMIN && (
            <AdminPanel 
              feeds={feeds} 
              zones={zones} 
              events={events}
              users={users}
              onUpdateFeed={setFeeds}
              onUpdateZones={setZones}
              onAddEvent={handleAddEvent}
              onDeleteEvent={handleDeleteEvent}
              onAddUser={handleAddUser}
              onDeleteUser={handleDeleteUser}
            />
          )}

          {currentView === ViewState.ALERTS && (
             <div className="max-w-4xl mx-auto h-[80vh]">
               <AlertsPanel alerts={alerts} onResolve={handleResolveAlert} soundSettings={soundSettings} />
             </div>
          )}
        </div>

        {/* AI Report Modal */}
        {aiReport && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
            <div className="glass w-full max-w-3xl rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden border border-blue-500/20">
              <div className="p-6 border-b border-white/10 flex justify-between items-center bg-slate-900/50">
                <div className="flex items-center gap-4">
                   <div className="p-3 bg-blue-600 rounded-xl shadow-lg shadow-blue-600/20">
                     <BrainCircuit className="w-6 h-6 text-white" />
                   </div>
                   <div>
                     <h3 className="text-xl font-bold text-white">Tactical Safety Analysis</h3>
                     <p className="text-xs text-blue-300 font-mono mt-0.5">GENERATED BY GEMINI PRO VISION</p>
                   </div>
                </div>
                <button onClick={() => setAiReport(null)} className="text-slate-400 hover:text-white">Close</button>
              </div>
              <div className="p-8 overflow-y-auto text-slate-300 leading-relaxed custom-scrollbar whitespace-pre-wrap">{aiReport}</div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
