import React from 'react';
import { Plus, Filter, Play, Pause, MoreVertical } from 'lucide-react';

const sequences = [
  { id: 1, name: 'Welcome Series', type: 'WELCOME', status: 'active', leads: 34, sent: 89, opens: 42, clicks: 12, replies: 8 },
  { id: 2, name: 'DFI Nurture Campaign', type: 'NURTURE', status: 'active', leads: 67, sent: 234, opens: 98, clicks: 23, replies: 15 },
  { id: 3, name: 'Proposal Follow-up', type: 'PROPOSAL_FOLLOWUP', status: 'active', leads: 12, sent: 36, opens: 28, clicks: 9, replies: 6 },
  { id: 4, name: 'Re-engagement Q4', type: 'RE_ENGAGEMENT', status: 'paused', leads: 89, sent: 178, opens: 45, clicks: 8, replies: 3 },
  { id: 5, name: 'Post-Win Onboarding', type: 'POST_WIN', status: 'active', leads: 8, sent: 24, opens: 22, clicks: 18, replies: 12 },
];

const Sequences: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button className="px-4 py-2 bg-jasper-carbon border border-white/10 hover:border-white/20 rounded-lg text-sm text-slate-300 flex items-center gap-2 transition-colors">
            <Filter className="w-4 h-4" />
            Filter
          </button>
          <div className="h-8 w-px bg-white/10 hidden md:block"></div>
          <span className="text-sm text-slate-500 hidden md:block">{sequences.length} sequences</span>
        </div>
        
        <button className="px-5 py-2.5 bg-jasper-emerald hover:bg-emerald-600 text-white font-medium rounded-lg flex items-center gap-2 transition-all shadow-[0_0_15px_rgba(44,138,91,0.3)]">
          <Plus className="w-4 h-4" />
          <span>New Sequence</span>
        </button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {sequences.map((seq) => (
          <div key={seq.id} className="glass-card rounded-xl p-0 flex flex-col hover:-translate-y-1 transition-transform duration-300">
             {/* Status Stripe */}
             <div className={`h-1 w-full ${seq.status === 'active' ? 'bg-jasper-emerald' : 'bg-slate-600'}`}></div>
             
             <div className="p-6 flex-1">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-white font-medium text-lg">{seq.name}</h3>
                    <span className="text-[10px] bg-white/5 px-2 py-0.5 rounded text-slate-400 uppercase tracking-wider border border-white/5 mt-2 inline-block">
                      {seq.type.replace('_', ' ')}
                    </span>
                  </div>
                  <button className="text-slate-500 hover:text-white transition-colors">
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4 my-6">
                   <div className="bg-jasper-carbon/50 p-3 rounded-lg border border-white/5">
                      <div className="text-slate-500 text-xs mb-1">Enrolled</div>
                      <div className="text-white font-semibold">{seq.leads}</div>
                   </div>
                   <div className="bg-jasper-carbon/50 p-3 rounded-lg border border-white/5">
                      <div className="text-slate-500 text-xs mb-1">Sent</div>
                      <div className="text-white font-semibold">{seq.sent}</div>
                   </div>
                   <div className="bg-jasper-carbon/50 p-3 rounded-lg border border-white/5">
                      <div className="text-slate-500 text-xs mb-1">Opens</div>
                      <div className="text-jasper-glow font-semibold">{Math.round((seq.opens / seq.sent) * 100)}%</div>
                   </div>
                   <div className="bg-jasper-carbon/50 p-3 rounded-lg border border-white/5">
                      <div className="text-slate-500 text-xs mb-1">Replies</div>
                      <div className="text-white font-semibold">{seq.replies}</div>
                   </div>
                </div>
             </div>

             <div className="p-4 border-t border-white/5 flex gap-2">
                {seq.status === 'active' ? (
                  <button className="flex-1 py-2 rounded-lg bg-jasper-emerald/10 text-jasper-emerald border border-jasper-emerald/20 hover:bg-jasper-emerald/20 flex items-center justify-center gap-2 text-sm transition-colors">
                     <Pause className="w-3.5 h-3.5" /> Pause
                  </button>
                ) : (
                  <button className="flex-1 py-2 rounded-lg bg-slate-700/20 text-slate-300 border border-white/5 hover:bg-white/5 flex items-center justify-center gap-2 text-sm transition-colors">
                     <Play className="w-3.5 h-3.5" /> Resume
                  </button>
                )}
                <button className="px-3 py-2 rounded-lg bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white transition-colors text-sm">
                   Edit
                </button>
             </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Sequences;