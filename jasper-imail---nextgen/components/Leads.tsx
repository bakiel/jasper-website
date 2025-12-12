import React from 'react';
import { Mail, MoreVertical, Edit3 } from 'lucide-react';

const Leads: React.FC = () => {
  const leads = [
    { id: 1, name: 'John Mokwena', company: 'AgriTech Ltd', email: 'john@agritech.co.za', status: 'qualified', score: 85, sequence: 'DFI Nurture', lastActivity: '2 hours ago' },
    { id: 2, name: 'Sarah Ndlovu', company: 'GreenGrow Farms', email: 'sarah@greengrow.com', status: 'new', score: 72, sequence: 'Welcome', lastActivity: '5 hours ago' },
    { id: 3, name: 'David Okonkwo', company: 'SolarHarvest', email: 'david@solarharvest.ng', status: 'proposal', score: 91, sequence: 'Proposal Follow-up', lastActivity: '1 day ago' },
    { id: 4, name: 'Grace Mutua', company: 'Organic Kenya', email: 'grace@organic.ke', status: 'qualified', score: 78, sequence: 'DFI Nurture', lastActivity: '3 days ago' },
    { id: 5, name: 'Peter Kimani', company: 'TechFarm Nigeria', email: 'peter@techfarm.ng', status: 'new', score: 65, sequence: 'Welcome', lastActivity: '1 week ago' },
  ];

  return (
    <div className="glass-card rounded-2xl overflow-hidden">
       <div className="p-6 border-b border-white/5 flex justify-between items-center">
          <h2 className="text-white font-semibold">Lead Database</h2>
          <div className="flex gap-2">
             <button className="px-3 py-1.5 text-xs bg-white/5 hover:bg-white/10 text-white rounded-md border border-white/10 transition-colors">Export CSV</button>
          </div>
       </div>
       <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-jasper-carbon/50 text-xs text-slate-400 uppercase tracking-wider">
                <th className="px-6 py-4 font-medium">Lead Profile</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium">Lead Score</th>
                <th className="px-6 py-4 font-medium">Active Sequence</th>
                <th className="px-6 py-4 font-medium">Last Activity</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
               {leads.map((lead) => (
                  <tr key={lead.id} className="group hover:bg-white/[0.02] transition-colors">
                     <td className="px-6 py-4">
                        <div>
                           <div className="text-white font-medium">{lead.name}</div>
                           <div className="text-slate-500 text-xs mt-0.5">{lead.company}</div>
                        </div>
                     </td>
                     <td className="px-6 py-4">
                        <span className={`
                           px-2 py-1 rounded text-[10px] uppercase font-bold tracking-wide
                           ${lead.status === 'qualified' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 
                             lead.status === 'proposal' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                             'bg-blue-500/20 text-blue-400 border border-blue-500/30'}
                        `}>
                           {lead.status}
                        </span>
                     </td>
                     <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                           <div className="flex-1 h-1.5 w-16 bg-white/10 rounded-full overflow-hidden">
                              <div 
                                className={`h-full rounded-full ${lead.score > 80 ? 'bg-jasper-glow' : 'bg-yellow-500'}`} 
                                style={{ width: `${lead.score}%` }}
                              ></div>
                           </div>
                           <span className="text-sm text-slate-300 font-mono">{lead.score}</span>
                        </div>
                     </td>
                     <td className="px-6 py-4 text-slate-400 text-sm">
                        {lead.sequence}
                     </td>
                     <td className="px-6 py-4 text-slate-500 text-sm">
                        {lead.lastActivity}
                     </td>
                     <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                           <button className="p-1.5 hover:bg-white/10 rounded text-slate-400 hover:text-white transition-colors">
                              <Mail className="w-4 h-4" />
                           </button>
                           <button className="p-1.5 hover:bg-white/10 rounded text-slate-400 hover:text-white transition-colors">
                              <Edit3 className="w-4 h-4" />
                           </button>
                        </div>
                     </td>
                  </tr>
               ))}
            </tbody>
          </table>
       </div>
    </div>
  );
};

export default Leads;