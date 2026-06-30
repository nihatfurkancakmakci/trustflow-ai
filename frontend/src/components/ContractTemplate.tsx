"use client";

import { motion } from "framer-motion";
import { 
  ShieldCheck, Calendar, DollarSign, CheckCircle2, 
  AlertTriangle, Lock, Key, XOctagon, Fingerprint, Database, GitCommit, BookOpen 
} from "lucide-react";
import { Button } from "./ui/button";

export interface Milestone {
  id: number;
  name: string;
  percentage: number;
  amount: number;
  status?: "PENDING" | "SUBMITTED" | "APPROVED" | "REVISION_REQUESTED";
  commits?: { message: string; date: string }[];
}

export interface ProposalData {
  jobId: string;
  freelancerAddress: string;
  status: "PENDING_CLIENT" | "PENDING_FL" | "ACCEPTED" | "DECLINED" | "DELIVERED" | "COMPLETED" | "DISPUTED";
  // Section A: Economics
  hashAnchor: string;
  paymentAsset: string; 
  milestones: Milestone[];
  // Section B: Delivery
  timeLocks: string;
  acceptanceCriteria: string;
  revisions: string;
  reporting: string;
  // Section C: Security
  escrowInit: string;
  arbitration: string;
  killSwitch: string;
  ghostingClause: string;
  hostageClause: string;
  // Section D: Legal
  ipRights: string;
  nda: string;
}

interface ContractTemplateProps {
  data: ProposalData;
  viewMode: "client" | "freelancer";
  onAction: () => void;
  actionText: string;
  onDecline?: () => void;
  onCounterOffer?: () => void;
}

export function ContractTemplate({
  data,
  viewMode,
  onAction,
  actionText,
  onDecline,
  onCounterOffer
}: ContractTemplateProps) {
  return (

    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-[2px] rounded-2xl bg-gradient-to-b from-zinc-800 to-zinc-950 shadow-2xl relative overflow-hidden w-full max-w-5xl mx-auto"
    >
      <div className="absolute inset-0 bg-[conic-gradient(from_90deg,transparent_0_300deg,rgba(34,197,94,0.3)_360deg)] animate-[spin_10s_linear_infinite] opacity-30" />
      
      <div className="relative z-10 bg-zinc-950/95 backdrop-blur-2xl rounded-[14px] p-6 text-zinc-300 space-y-6 max-h-[80vh] overflow-y-auto custom-scrollbar">
        
        {/* Header */}
        <div className="border-b border-white/10 pb-4 flex flex-col md:flex-row md:justify-between md:items-start gap-4">
          <div>
            <h2 className="text-xl font-black text-white flex items-center gap-2">
              <Fingerprint className="w-5 h-5 text-green-500 shrink-0"/>
              <span className="break-words">Enterprise Smart Contract Proposal</span>
            </h2>
            <p className="text-sm font-mono text-green-500 mt-2 flex items-center gap-2 break-all">
              <ShieldCheck className="w-4 h-4 shrink-0" /> Provider: {data.freelancerAddress.substring(0, 6)}...{data.freelancerAddress.substring(data.freelancerAddress.length - 4)}
            </p>
          </div>
          <div className="text-left md:text-right p-3 rounded-xl bg-green-950/30 border border-green-500/20 w-full md:w-auto shrink-0">
            <span className="block text-xs font-bold text-green-500 uppercase">Total Locked Value</span>
            <span className="font-black text-2xl text-white flex items-center justify-start md:justify-end gap-1 mt-1">
              <DollarSign className="w-5 h-5 text-green-500 shrink-0"/>
              {data.paymentAsset}
            </span>
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Left Column: Scope, Delivery & Exec */}
          <div className="space-y-4">
            
            <div className="bg-black/40 p-4 rounded-xl border border-white/5 space-y-4">
              <h3 className="text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center gap-2"><Database className="w-4 h-4"/> Section A: Scope & Milestones</h3>
              
              <div>
                <span className="text-xs font-bold text-zinc-500 block mb-1">Cryptographic Scope (Hash Anchor)</span>
                <p className="text-xs text-zinc-300 bg-black/50 p-2 rounded border border-white/5 font-mono break-all">{data.hashAnchor}</p>
              </div>

              <div>
                <span className="text-xs font-bold text-zinc-500 block mb-2">Programmatic Tranches (Vec&lt;Milestone&gt;)</span>
                <div className="space-y-2">
                  {data.milestones.map((m, i) => (
                    <div key={i} className="flex justify-between items-center bg-zinc-900/50 p-2 rounded-lg border border-white/5">
                      <div className="flex items-center gap-2">
                        <span className="bg-blue-500/20 text-blue-400 text-xs px-2 py-0.5 rounded font-mono">#{m.id}</span>
                        <span className="text-sm text-zinc-300">{m.name}</span>
                      </div>
                      <div className="text-right">
                        <span className="block text-xs text-zinc-500">{m.percentage}%</span>
                        <span className="block text-sm font-bold text-white">{m.amount.toLocaleString()}</span>
                      </div>
                    </div>
                  ))}
                  {data.milestones.length === 0 && (
                    <div className="text-xs text-zinc-500 italic">No milestones defined.</div>
                  )}
                </div>
              </div>

              <div className="pt-2 border-t border-white/5">
                <span className="text-xs font-bold text-zinc-500 block mb-1">Gas Fees & State Rent (TTL)</span>
                <p className="text-xs text-blue-400 font-bold bg-blue-500/10 p-2 rounded">Client Pays via Fee-Bump (Platform Standard)</p>
              </div>
            </div>

            <div className="bg-black/40 p-4 rounded-xl border border-white/5 space-y-4">
              <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2"><Calendar className="w-4 h-4"/> Section B: Execution & Delivery</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-xs font-bold text-zinc-500 block mb-1">Delivery Time-Locks</span>
                  <p className="text-xs text-zinc-300">{data.timeLocks}</p>
                </div>
                <div>
                  <span className="text-xs font-bold text-zinc-500 block mb-1">Acceptance Criteria</span>
                  <p className="text-xs text-zinc-300">{data.acceptanceCriteria}</p>
                </div>
                <div>
                  <span className="text-xs font-bold text-zinc-500 block mb-1">Revisions & Iterations</span>
                  <p className="text-xs text-zinc-300">{data.revisions}</p>
                </div>
                <div>
                  <span className="text-xs font-bold text-zinc-500 block mb-1">Reporting Cadence</span>
                  <p className="text-xs text-zinc-300">{data.reporting}</p>
                </div>
              </div>
            </div>

          </div>

          {/* Right Column: Security & Legal */}
          <div className="space-y-4">
            
            <div className="bg-red-950/20 p-4 rounded-xl border border-red-500/30 space-y-4 shadow-[inset_0_0_20px_rgba(239,68,68,0.1)]">
              <h3 className="text-xs font-bold text-red-400 uppercase tracking-wider flex items-center gap-2"><AlertTriangle className="w-4 h-4"/> Section C: Strict Security & Timelocks</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-[10px] font-black text-red-500/70 block mb-1 uppercase tracking-wider">Escrow Initialization</span>
                  <p className="text-xs text-red-100 font-mono bg-red-950/40 p-2 rounded border border-red-500/10">{data.escrowInit}</p>
                </div>
                <div>
                  <span className="text-[10px] font-black text-red-500/70 block mb-1 uppercase tracking-wider">Arbitration Designation</span>
                  <p className="text-xs text-red-100 font-mono bg-red-950/40 p-2 rounded border border-red-500/10">{data.arbitration}</p>
                </div>
                <div className="col-span-2">
                  <span className="text-[10px] font-black text-red-500/70 block mb-1 flex items-center gap-1 uppercase tracking-wider"><XOctagon className="w-3 h-3"/> Late Penalty (Slashing)</span>
                  <p className="text-xs text-red-100 font-mono bg-red-950/40 p-2 rounded border border-red-500/10">{data.killSwitch}</p>
                </div>
              </div>

              <div className="border-t border-red-500/20 pt-3 space-y-3">
                <div>
                  <span className="text-[10px] font-black text-red-500/70 block mb-1 flex items-center gap-1 uppercase tracking-wider"><GitCommit className="w-3 h-3"/> Ghosting Clause (Auto-Refund)</span>
                  <p className="text-xs text-red-100 font-mono bg-red-950/40 p-2 rounded border border-red-500/10">{data.ghostingClause}</p>
                </div>
                <div>
                  <span className="text-[10px] font-black text-red-500/70 block mb-1 flex items-center gap-1 uppercase tracking-wider"><CheckCircle2 className="w-3 h-3"/> Hostage Clause (Auto-Release)</span>
                  <p className="text-xs text-red-100 font-mono bg-red-950/40 p-2 rounded border border-red-500/10">{data.hostageClause}</p>
                </div>
              </div>
            </div>

            <div className="bg-black/40 p-4 rounded-xl border border-white/5 space-y-4">
              <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2"><BookOpen className="w-4 h-4"/> Section D: Legal & Compliance</h3>
              
              <div>
                <span className="text-xs font-bold text-zinc-500 flex items-center gap-1 mb-1"><Lock className="w-3 h-3"/> IP Rights Transfer</span>
                <p className="text-xs text-zinc-300 leading-relaxed">{data.ipRights}</p>
              </div>
              <div>
                <span className="text-xs font-bold text-zinc-500 flex items-center gap-1 mb-1"><Key className="w-3 h-3"/> Confidentiality (NDA)</span>
                <p className="text-xs text-zinc-300 leading-relaxed">{data.nda}</p>
              </div>
            </div>

          </div>

        </div>

        {/* Action Button */}
        <div className="pt-6 border-t border-white/10 flex flex-col md:flex-row md:justify-between md:items-center gap-4 sticky bottom-0 bg-zinc-950/95 backdrop-blur-md pb-4">
          <div className="text-sm font-mono text-zinc-400 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse shrink-0"></span>
            <span>Status: {data.status === "PENDING_FL" ? "Waiting for Freelancer Signature" : data.status === "PENDING_CLIENT" ? "Waiting for Client Signature" : data.status === "ACCEPTED" ? "Funds Locked & Contract Active" : "Declined"}</span>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
            {viewMode === "client" && onDecline && (
              <Button variant="outline" onClick={onDecline} className="w-full sm:w-auto border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300 hover:border-red-500 transition-all py-2.5">
                Decline
              </Button>
            )}
            {onCounterOffer && (
              <Button variant="outline" onClick={onCounterOffer} className="w-full sm:w-auto border-blue-500/30 text-blue-400 hover:bg-blue-500/10 hover:text-blue-300 hover:border-blue-500 transition-all py-2.5">
                Counter Offer
              </Button>
            )}
            {onAction && (
              <Button 
                onClick={onAction}
                className="w-full sm:w-auto bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-black font-extrabold px-8 shadow-[0_0_20px_rgba(34,197,94,0.3)] hover:shadow-[0_0_30px_rgba(34,197,94,0.6)] betterhover:active:scale-[0.98] transition-all py-2.5"
              >
                {actionText}
              </Button>
            )}
          </div>
        </div>

      </div>
    </motion.div>
  );
}
