import React from 'react';
import { 
  Users, Zap, Send, Eye, ArrowUpRight, RefreshCw 
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, Tooltip, XAxis } from 'recharts';
import { GlassCard } from '../components/ui/GlassCard';

export default function DashboardPage() {
  const chartData = [
    { name: 'Mon', value: 400 },
    { name: 'Tue', value: 300 },
    { name: 'Wed', value: 550 },
    { name: 'Thu', value: 480 },
    { name: 'Fri', value: 690 },
    { name: 'Sat', value: 800 },
    { name: 'Sun', value: 750 },
  ];

  const logs = [
    { time: '10:42:01', status: 'SENT', msg: 'Welcome Series #1 -> user@corp.com', color: 'text-jasper-glow' },
    { time: '10:43:15', status: 'OPEN', msg: 'DFI Funding Proposal viewed', color: 'text-blue-400' },
    { time: '10:45:00', status: 'CLICK', msg: 'Link: "View Calendar" clicked', color: 'text-yellow-400' },
    { time: '10:48:22', status: 'REPLY', msg: 'Response from AgriTech Ltd', color: 'text-purple-400' },
    { time: '10:50:05', status: 'SENT', msg: 'Nurture Campaign #3 -> ceo@startup.io', color: 'text-jasper-glow' },
  ];

  return (
    <div className="grid grid-cols-12 gap-6 pb-20">
      {/* Overview Stats */}
      <div className="col-span-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatWidget title="Total Leads" value="247" trend="+12%" icon={Users} />
        <StatWidget title="Active Sequences" value="12" trend="+3" icon={Zap} />
        <StatWidget title="Emails Sent" value="1,847" trend="+18%" icon={Send} />
        <StatWidget title="Avg Open Rate" value="42.3%" trend="+4.1%" icon={Eye} />
      </div>

      {/* Charts */}
      <GlassCard className="col-span-12 lg:col-span-8 h-[360px] flex flex-col">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
             <div className="w-2 h-2 rounded-full bg-jasper-glow animate-pulse"></div>
             <h3 className="text-sm font-semibold text-white tracking-wide">Email Performance Traffic</h3>
          </div>
          <div className="flex gap-2">
              <button className="text-[10px] px-3 py-1 rounded-md bg-white/10 text-white border border-white/10 hover:border-jasper-emerald/50 transition-colors">1H</button>
              <button className="text-[10px] px-3 py-1 rounded-md text-slate-500 hover:text-white transition-colors">24H</button>
          </div>
        </div>
        <div className="flex-1 w-full min-h-0">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2C8A5B" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#2C8A5B" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <Tooltip 
                contentStyle={{ backgroundColor: '#0B1E2B', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }}
                itemStyle={{ color: '#44D685' }}
              />
              <XAxis dataKey="name" stroke="#475569" fontSize={12} tickLine={false} axisLine={false} />
              <Area 
                type="monotone" 
                dataKey="value" 
                stroke="#44D685" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorValue)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </GlassCard>

      {/* Logs */}
      <GlassCard className="col-span-12 lg:col-span-4 h-[360px] flex flex-col">
        <div className="flex justify-between items-center mb-6 pb-4 border-b border-white/5">
          <h3 className="text-sm font-semibold text-white tracking-wide">Live Event Stream</h3>
          <RefreshCw className="w-4 h-4 text-slate-500 hover:text-jasper-glow cursor-pointer transition-colors" />
        </div>
        <div className="flex-1 overflow-y-auto space-y-1 font-mono text-[11px] pr-2 custom-scrollbar">
          {logs.map((log, i) => (
            <div key={i} className="flex gap-3 items-center p-2 rounded hover:bg-white/5 transition-colors cursor-default group">
              <span className="text-slate-600">{log.time}</span>
              <span className={`font-bold w-12 ${log.color}`}>{log.status}</span>
              <span className="text-slate-400 group-hover:text-white truncate transition-colors">{log.msg}</span>
            </div>
          ))}
          <div className="flex gap-3 items-center p-2 opacity-50">
            <span className="text-slate-600">10:41:55</span>
            <span className="font-bold w-12 text-slate-500">SYS</span>
            <span className="text-slate-500">Syncing lead data...</span>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}

const StatWidget = ({ title, value, trend, icon: Icon, colorClass = "text-jasper-glow" }: any) => (
  <GlassCard>
    <div className="flex justify-between items-start mb-4">
      <div>
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">{title}</h3>
        <div className="text-2xl font-bold text-white tracking-tight">{value}</div>
      </div>
      <div className={`p-2 rounded-lg bg-white/5 ${colorClass} shadow-[0_0_15px_rgba(44,214,133,0.1)]`}>
        <Icon className="w-5 h-5" />
      </div>
    </div>
    <div className="flex items-center gap-2 text-xs">
      <span className="text-emerald-400 flex items-center gap-1 font-medium bg-emerald-500/10 px-1.5 py-0.5 rounded">
        <ArrowUpRight className="w-3 h-3" /> {trend}
      </span>
      <span className="text-slate-500">vs last period</span>
    </div>
    
    <div className="w-full h-1 bg-white/5 rounded-full mt-4 overflow-hidden">
      <div className="h-full w-[70%] bg-gradient-to-r from-jasper-emerald to-jasper-glow rounded-full"></div>
    </div>
  </GlassCard>
);
