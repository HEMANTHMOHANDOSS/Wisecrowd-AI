
import React, { useState } from 'react';
import { CameraFeed, VenueZone, Event, User } from '../types';
import { Settings, Plus, Trash2, Save, RefreshCw, Camera, AlertOctagon, Edit3, Calendar, MapPin, Users, Activity, BarChart3, Search } from 'lucide-react';

interface AdminPanelProps {
  feeds: CameraFeed[];
  zones: VenueZone[];
  events: Event[];
  users: User[];
  onUpdateFeed: (feeds: CameraFeed[]) => void;
  onUpdateZones: (zones: VenueZone[]) => void;
  onAddEvent: (event: Event) => void;
  onDeleteEvent: (id: string) => void;
  onAddUser: (user: User) => void;
  onDeleteUser: (id: string) => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ 
  feeds, 
  zones, 
  events, 
  users, 
  onUpdateFeed, 
  onUpdateZones, 
  onAddEvent, 
  onDeleteEvent, 
  onAddUser, 
  onDeleteUser 
}) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'cameras' | 'zones' | 'events' | 'system'>('dashboard');

  // Event Form State
  const [newEvent, setNewEvent] = useState({
    name: '',
    address: '',
    lat: '',
    lng: '',
    attendees: 0,
    startTime: ''
  });

  // User Form State
  const [newUser, setNewUser] = useState({
    username: '',
    password: '',
    role: 'viewer' as 'admin' | 'viewer',
    email: ''
  });

  const handleCapacityChange = (id: string, newCap: string) => {
    const cap = parseInt(newCap);
    if (isNaN(cap)) return;
    const updatedFeeds = feeds.map(f => f.id === id ? { ...f, capacity: cap } : f);
    onUpdateFeed(updatedFeeds);
  };

  const handleAddEventSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEvent.name || !newEvent.lat || !newEvent.lng) return;

    const event: Event = {
      id: `evt-${Date.now()}`,
      name: newEvent.name,
      location: {
        lat: parseFloat(newEvent.lat),
        lng: parseFloat(newEvent.lng),
        address: newEvent.address
      },
      status: 'scheduled',
      attendees: 0,
      riskScore: 0,
      startTime: newEvent.startTime || new Date().toISOString()
    };

    onAddEvent(event);
    setNewEvent({ name: '', address: '', lat: '', lng: '', attendees: 0, startTime: '' }); // Reset
  };

  const handleAddUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.username || !newUser.password) return;

    const user: User = {
      id: `usr-${Date.now()}`,
      username: newUser.username,
      password: newUser.password,
      role: newUser.role,
      email: newUser.email || `${newUser.username}@example.com`,
      status: 'active',
      lastLogin: 'Never'
    };

    onAddUser(user);
    setNewUser({ username: '', password: '', role: 'viewer', email: '' });
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      
      {/* Header Tabs */}
      <div className="glass p-2 rounded-xl inline-flex gap-1 overflow-x-auto max-w-full">
        {['dashboard', 'users', 'events', 'cameras', 'zones', 'system'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`px-4 py-2 rounded-lg text-sm font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
              activeTab === tab 
                ? 'bg-blue-600 text-white shadow-lg' 
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="glass rounded-2xl p-6 min-h-[500px]">
        
        {/* DASHBOARD OVERVIEW */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-400" />
              System Overview
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-6 bg-slate-900/50 rounded-xl border border-white/5 flex items-center justify-between">
                 <div>
                   <p className="text-xs font-bold text-slate-400 uppercase">Total Users</p>
                   <h2 className="text-3xl font-bold text-white mt-1">{users.length}</h2>
                 </div>
                 <div className="p-3 bg-blue-500/20 rounded-lg text-blue-400">
                   <Users className="w-6 h-6" />
                 </div>
              </div>
              <div className="p-6 bg-slate-900/50 rounded-xl border border-white/5 flex items-center justify-between">
                 <div>
                   <p className="text-xs font-bold text-slate-400 uppercase">Active Events</p>
                   <h2 className="text-3xl font-bold text-white mt-1">{events.filter(e => e.status === 'active').length}</h2>
                 </div>
                 <div className="p-3 bg-green-500/20 rounded-lg text-green-400">
                   <Calendar className="w-6 h-6" />
                 </div>
              </div>
              <div className="p-6 bg-slate-900/50 rounded-xl border border-white/5 flex items-center justify-between">
                 <div>
                   <p className="text-xs font-bold text-slate-400 uppercase">Cameras Online</p>
                   <h2 className="text-3xl font-bold text-white mt-1">{feeds.filter(f => f.status === 'active').length} / {feeds.length}</h2>
                 </div>
                 <div className="p-3 bg-purple-500/20 rounded-lg text-purple-400">
                   <Camera className="w-6 h-6" />
                 </div>
              </div>
            </div>
          </div>
        )}

        {/* USER MANAGEMENT */}
        {activeTab === 'users' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
             {/* Add User Form */}
             <div className="lg:col-span-1 bg-slate-900/50 p-6 rounded-xl border border-white/5 h-fit">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                   <Plus className="w-5 h-5 text-green-400" /> Register User
                </h3>
                <form onSubmit={handleAddUserSubmit} className="space-y-4">
                   <div>
                     <label className="text-xs font-bold text-slate-400 uppercase block mb-1">Username</label>
                     <input 
                       type="text"
                       required
                       value={newUser.username}
                       onChange={(e) => setNewUser({...newUser, username: e.target.value})}
                       className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:border-blue-500 outline-none"
                       placeholder="jdoe"
                     />
                   </div>
                   <div>
                     <label className="text-xs font-bold text-slate-400 uppercase block mb-1">Password</label>
                     <input 
                       type="password"
                       required
                       value={newUser.password}
                       onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                       className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:border-blue-500 outline-none"
                       placeholder="••••••"
                     />
                   </div>
                   <div>
                     <label className="text-xs font-bold text-slate-400 uppercase block mb-1">Role</label>
                     <select 
                       value={newUser.role}
                       onChange={(e) => setNewUser({...newUser, role: e.target.value as any})}
                       className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:border-blue-500 outline-none"
                     >
                       <option value="viewer">Viewer (Read Only)</option>
                       <option value="admin">Admin (Full Access)</option>
                     </select>
                   </div>
                   <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-blue-600/20 mt-2">
                     Create User
                   </button>
                </form>
             </div>

             {/* User List */}
             <div className="lg:col-span-2">
               <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Users className="w-5 h-5 text-blue-400" /> User Directory
                  </h3>
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
                    <input type="text" placeholder="Search users..." className="pl-9 pr-4 py-2 bg-slate-800 rounded-lg text-sm text-white border border-slate-700 focus:border-blue-500 outline-none" />
                  </div>
               </div>
               
               <div className="overflow-x-auto rounded-xl border border-white/5">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-900/80">
                      <tr className="text-xs text-slate-500 border-b border-white/10">
                        <th className="p-4 uppercase font-bold">User Info</th>
                        <th className="p-4 uppercase font-bold">Role</th>
                        <th className="p-4 uppercase font-bold">Status</th>
                        <th className="p-4 uppercase font-bold text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm">
                      {users.map((user) => (
                        <tr key={user.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                               <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center font-bold text-xs uppercase">
                                 {user.username.substring(0,2)}
                               </div>
                               <div>
                                 <div className="font-bold text-slate-200">{user.username}</div>
                                 <div className="text-xs text-slate-500">{user.email}</div>
                               </div>
                            </div>
                          </td>
                          <td className="p-4">
                            <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase ${
                              user.role === 'admin' ? 'bg-purple-500/20 text-purple-400' : 'bg-blue-500/20 text-blue-400'
                            }`}>
                              {user.role}
                            </span>
                          </td>
                          <td className="p-4">
                             <span className="flex items-center gap-1.5 text-xs text-green-400">
                               <span className="w-1.5 h-1.5 rounded-full bg-green-400"></span> Active
                             </span>
                          </td>
                          <td className="p-4 text-right">
                             <button 
                               onClick={() => onDeleteUser(user.id)}
                               className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                               title="Delete User"
                             >
                               <Trash2 className="w-4 h-4" />
                             </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
               </div>
             </div>
          </div>
        )}

        {activeTab === 'cameras' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Camera className="w-5 h-5 text-blue-400" />
                Camera Configuration
              </h3>
              <button className="flex items-center gap-2 px-3 py-1.5 bg-green-600 hover:bg-green-500 text-white rounded-lg text-xs font-bold uppercase transition-colors">
                <Plus className="w-4 h-4" /> Add Camera
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-xs text-slate-500 border-b border-white/10">
                    <th className="p-3 uppercase font-bold">Status</th>
                    <th className="p-3 uppercase font-bold">Name / ID</th>
                    <th className="p-3 uppercase font-bold">Location</th>
                    <th className="p-3 uppercase font-bold">Capacity Threshold</th>
                    <th className="p-3 uppercase font-bold">Actions</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {feeds.map((feed) => (
                    <tr key={feed.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="p-3">
                        <div className={`flex items-center gap-2 px-2 py-1 rounded w-fit text-[10px] font-bold uppercase ${
                          feed.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                        }`}>
                          <div className={`w-1.5 h-1.5 rounded-full ${feed.status === 'active' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                          {feed.status}
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="font-bold text-slate-200">{feed.name}</div>
                        <div className="text-xs text-slate-500 font-mono">{feed.id}</div>
                      </td>
                      <td className="p-3 text-slate-400">{feed.location}</td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                           <input 
                             type="number" 
                             defaultValue={feed.capacity}
                             className="w-20 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200 text-xs focus:border-blue-500 outline-none"
                             onBlur={(e) => handleCapacityChange(feed.id, e.target.value)}
                           />
                           <span className="text-xs text-slate-500">ppl</span>
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="flex gap-2">
                          <button className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 rounded transition-colors" title="Edit">
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors" title="Delete">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'events' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Add Event Form */}
              <div className="lg:col-span-1 bg-slate-900/50 p-6 rounded-xl border border-white/5">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                   <Plus className="w-5 h-5 text-green-400" /> Add New Event
                </h3>
                <form onSubmit={handleAddEventSubmit} className="space-y-4">
                   <div>
                     <label className="text-xs font-bold text-slate-400 uppercase block mb-1">Event Name</label>
                     <input 
                       type="text"
                       required
                       value={newEvent.name}
                       onChange={(e) => setNewEvent({...newEvent, name: e.target.value})}
                       className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:border-blue-500 outline-none"
                       placeholder="e.g. City Marathon 2025"
                     />
                   </div>
                   
                   <div>
                     <label className="text-xs font-bold text-slate-400 uppercase block mb-1">Location / Address</label>
                     <input 
                       type="text"
                       required
                       value={newEvent.address}
                       onChange={(e) => setNewEvent({...newEvent, address: e.target.value})}
                       className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:border-blue-500 outline-none"
                       placeholder="e.g. Central Park, NY"
                     />
                   </div>

                   <div className="grid grid-cols-2 gap-4">
                     <div>
                       <label className="text-xs font-bold text-slate-400 uppercase block mb-1">Latitude</label>
                       <input 
                         type="number"
                         step="any"
                         required
                         value={newEvent.lat}
                         onChange={(e) => setNewEvent({...newEvent, lat: e.target.value})}
                         className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:border-blue-500 outline-none"
                         placeholder="40.7128"
                       />
                     </div>
                     <div>
                       <label className="text-xs font-bold text-slate-400 uppercase block mb-1">Longitude</label>
                       <input 
                         type="number"
                         step="any"
                         required
                         value={newEvent.lng}
                         onChange={(e) => setNewEvent({...newEvent, lng: e.target.value})}
                         className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:border-blue-500 outline-none"
                         placeholder="-74.0060"
                       />
                     </div>
                   </div>

                   <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-blue-600/20 mt-2">
                     Create Event
                   </button>
                </form>
              </div>

              {/* Event List */}
              <div className="lg:col-span-2">
                 <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                   <Calendar className="w-5 h-5 text-blue-400" /> Active & Scheduled Events
                 </h3>
                 <div className="space-y-3">
                   {events.map(evt => (
                     <div key={evt.id} className="p-4 bg-slate-900/30 rounded-xl border border-white/5 flex items-center justify-between group hover:border-blue-500/30 transition-all">
                        <div className="flex items-start gap-4">
                           <div className={`p-2 rounded-lg ${evt.status === 'active' ? 'bg-green-500/10 text-green-400' : 'bg-slate-700/30 text-slate-400'}`}>
                             <Calendar className="w-5 h-5" />
                           </div>
                           <div>
                              <h4 className="font-bold text-white text-sm">{evt.name}</h4>
                              <p className="text-xs text-slate-400 flex items-center gap-1 mt-1">
                                <MapPin className="w-3 h-3" /> {evt.location.address}
                              </p>
                              <div className="flex gap-2 mt-2">
                                <span className="text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-300 font-mono">
                                  {evt.location.lat.toFixed(4)}, {evt.location.lng.toFixed(4)}
                                </span>
                              </div>
                           </div>
                        </div>
                        <div className="flex items-center gap-3">
                           <span className={`text-xs font-bold px-2 py-1 rounded uppercase ${evt.status === 'active' ? 'bg-green-500/10 text-green-400' : 'bg-blue-500/10 text-blue-400'}`}>
                             {evt.status}
                           </span>
                           <button 
                            onClick={() => onDeleteEvent(evt.id)}
                            className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                           >
                             <Trash2 className="w-4 h-4" />
                           </button>
                        </div>
                     </div>
                   ))}
                 </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'system' && (
          <div className="max-w-2xl space-y-8">
            <div>
              <h3 className="text-xl font-bold text-white mb-4">System Parameters</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="p-4 bg-slate-900/50 rounded-xl border border-white/5">
                    <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">Global Refresh Rate</label>
                    <select className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-sm text-white">
                      <option>1000ms (Real-time)</option>
                      <option>3000ms (Balanced)</option>
                      <option>5000ms (Low Bandwidth)</option>
                    </select>
                 </div>
                 <div className="p-4 bg-slate-900/50 rounded-xl border border-white/5">
                    <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">Data Retention</label>
                    <select className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-sm text-white">
                      <option>7 Days</option>
                      <option>30 Days</option>
                      <option>90 Days</option>
                      <option>1 Year</option>
                    </select>
                 </div>
              </div>
            </div>

            <div>
               <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                 <AlertOctagon className="w-5 h-5 text-orange-400" />
                 Alert Configuration
               </h3>
               <div className="space-y-3">
                 <div className="flex items-center justify-between p-4 bg-slate-900/50 rounded-xl border border-white/5">
                    <div>
                      <h4 className="font-bold text-sm text-slate-200">Email Notifications</h4>
                      <p className="text-xs text-slate-500">Receive critical alerts via email</p>
                    </div>
                    <div className="w-12 h-6 bg-blue-600 rounded-full relative cursor-pointer">
                      <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow-md"></div>
                    </div>
                 </div>
                 <div className="flex items-center justify-between p-4 bg-slate-900/50 rounded-xl border border-white/5">
                    <div>
                      <h4 className="font-bold text-sm text-slate-200">SMS / Push</h4>
                      <p className="text-xs text-slate-500">Receive alerts on mobile devices</p>
                    </div>
                    <div className="w-12 h-6 bg-slate-700 rounded-full relative cursor-pointer">
                      <div className="absolute left-1 top-1 w-4 h-4 bg-slate-400 rounded-full shadow-md"></div>
                    </div>
                 </div>
               </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;
