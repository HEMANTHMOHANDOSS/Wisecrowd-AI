
import React, { useState } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Legend, ComposedChart, Line
} from 'recharts';
import { CrowdMetric, TimeRange } from '../types';
import { Calendar, Download } from 'lucide-react';

interface AnalyticsProps {
  data: CrowdMetric[];
}

const Analytics: React.FC<AnalyticsProps> = ({ data }) => {
  const [timeRange, setTimeRange] = useState<TimeRange['value']>('1h');

  // Simulated data modifiers based on time range
  const displayData = data; 

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex gap-2 p-1 bg-slate-900/50 rounded-lg border border-white/5">
          {[
            { label: '1 Hour', value: '1h' },
            { label: '24 Hours', value: '24h' },
            { label: '7 Days', value: '7d' },
            { label: '30 Days', value: '30d' },
          ].map((range) => (
            <button
              key={range.value}
              onClick={() => setTimeRange(range.value as any)}
              className={`px-3 py-1.5 text-xs font-bold rounded transition-all ${
                timeRange === range.value 
                  ? 'bg-blue-600 text-white shadow-md' 
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {range.label}
            </button>
          ))}
        </div>
        
        <button className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-bold border border-white/5 transition-colors">
          <Download className="w-4 h-4" /> Export CSV
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Historical Density Trend */}
        <div className="glass p-6 rounded-2xl">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                Crowd Density Trends
              </h3>
              <p className="text-xs text-slate-400">Historical occupancy analysis</p>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500">
               <Calendar className="w-4 h-4" />
               <span>{timeRange === '1h' ? 'Live Data' : 'Historical Data'}</span>
            </div>
          </div>
          
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={displayData}>
                <defs>
                  <linearGradient id="colorCountHist" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} opacity={0.3} />
                <XAxis 
                  dataKey="time" 
                  stroke="#64748b" 
                  tick={{fill: '#94a3b8', fontSize: 10}}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis 
                  stroke="#64748b" 
                  tick={{fill: '#94a3b8', fontSize: 10}}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc', borderRadius: '8px' }}
                />
                <Area 
                  type="monotone" 
                  name="Occupancy"
                  dataKey="count" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorCountHist)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Risk & Flow Analysis */}
        <div className="glass p-6 rounded-2xl">
          <h3 className="text-lg font-bold text-white mb-6">Risk vs Flow Correlation</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={displayData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} opacity={0.3} />
                <XAxis 
                  dataKey="time" 
                  stroke="#64748b" 
                  tick={{fill: '#94a3b8', fontSize: 10}}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis yAxisId="left" stroke="#64748b" tick={{fontSize: 10}} axisLine={false} />
                <YAxis yAxisId="right" orientation="right" stroke="#64748b" tick={{fontSize: 10}} axisLine={false} />
                <Tooltip 
                   contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                />
                <Legend wrapperStyle={{fontSize: '12px', paddingTop: '10px'}} />
                <Bar yAxisId="left" name="Flow Rate" dataKey="flowRate" fill="#0aff68" radius={[4, 4, 0, 0]} barSize={20} opacity={0.8} />
                <Line yAxisId="right" name="Risk Score" type="monotone" dataKey="riskScore" stroke="#ff003c" strokeWidth={2} dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
