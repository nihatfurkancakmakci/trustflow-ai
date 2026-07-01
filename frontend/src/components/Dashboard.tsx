"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Briefcase, UserCircle, PlusCircle, Search, Calendar, DollarSign, Send, FileCode2, Info, Edit, Trash2, TrendingUp, Users, CheckCircle, Clock, Lock, GitCommit, Brain, Sparkles, AlertTriangle, CheckCircle2, Wrench } from "lucide-react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { ContractTemplate, ProposalData, Milestone } from "./ContractTemplate";
import { toast } from "sonner";
import { useEscrowContract } from "../hooks/useEscrowContract";

// ======================= HELPER DATA (ENUMS & UI TEXT) =======================

const ESCROW_PREFS = [
  { value: "Full Escrow (Completion Release)", text: "Güvence bedelinin %100'ü akıllı sözleşmede kilitlenir ve iş tamamen onaylanana kadar serbest kalmaz. (Kısa süreli işler için önerilir)." },
  { value: "Milestone-Based Escrow", text: "Güvence bedeli kilometre taşlarına bölünür. İşin bir kısmı bittikçe ara ödemeler serbest kalır. (Uzun süreli işler için önerilir)." }
];

const DISPUTE_ORACLES = [
  { value: "TrustFlow Platform Oracle", text: "Anlaşmazlık durumunda nihai kararı TrustFlow AI yapay zekası ve moderasyon ekibi verir." },
  { value: "Multi-Sig Consensus", text: "Paranın çıkması için Müşteri, Freelancer ve atanan Hakemden en az 2'sinin (2-of-3) onayı gerekir." }
];

const LATE_PENALTIES = [
  { value: "Hard Deadline (Auto-Terminate)", text: "Freelancer kesin tarihe kadar teslimat yapmazsa, sözleşme iptal edilir ve para müşteriye döner." },
  { value: "Fixed Fee Deduction", text: "Gecikme durumunda müşteriye önceden belirlenmiş sabit bir tazminat iade edilir." }
];

const PAYMENT_ASSETS = ["USDC (Stellar)", "XLM (Native)", "EURC (Stellar Euro)", "Custom Asset (Token Address)"];

const REVISIONS_OPTS = [
  "No Revisions (As-is Delivery)",
  "1 Round of Revisions",
  "2 Rounds of Revisions",
  "3 Rounds of Revisions",
  "Unlimited (Until Satisfied)"
];

const DELIVERY_UNITS = ["Days", "Weeks", "Months"];

export const JOB_CATEGORIES = [
  "Web Development",
  "Mobile App",
  "Smart Contract / Web3",
  "UI/UX Design",
  "AI & Machine Learning",
  "Other"
];

// ======================= INTERFACES =======================

export interface JobData {
  id: string;
  title: string;
  category?: string;
  scope: string;
  budgetRange: string;
  paymentAsset: string;
  timelineAmount: string;
  timelineUnit: string;
  expectedRevisions: string;
  expertise: string;
  escrowType: string;
  disputePref: string;
  penaltyPref: string;
  ghostingTimelock: string;
  hostageTimelock: string;
  budget?: number;
  description?: string;
}

const MOCK_JOBS: JobData[] = [
  {
    id: "JOB-9021",
    title: "Build a Cross-Border Remittance Widget on Soroban",
    category: "Smart Contract / Web3",
    scope: "Develop a fully compliant, self-hosted cross-border remittance widget using Stellar's SEP-31 and Soroban smart contracts. Must handle strict compliance flows.",
    budgetRange: "3,000 - 5,000",
    paymentAsset: "USDC (Stellar)",
    timelineAmount: "2",
    timelineUnit: "Months",
    expectedRevisions: REVISIONS_OPTS[4],
    expertise: "Senior (Soroban, React, KYC/AML)",
    escrowType: "Milestone-Based Escrow",
    disputePref: "TrustFlow Platform Oracle",
    penaltyPref: "Fixed Fee Deduction",
    ghostingTimelock: "7 Days",
    hostageTimelock: "14 Days"
  },
  {
    id: "JOB-9022",
    title: "Frontend Developer for AI Chatbot",
    category: "Web Development",
    scope: "Need a talented frontend dev to integrate our internal LLM API into a slick, modern React Native and Next.js interface. Must have experience with real-time streaming.",
    budgetRange: "1,500 - 3,000",
    paymentAsset: "XLM (Native)",
    timelineAmount: "3",
    timelineUnit: "Weeks",
    expectedRevisions: REVISIONS_OPTS[2],
    expertise: "Intermediate (React, Next.js, AI APIs)",
    escrowType: "Full Escrow (Completion Release)",
    disputePref: "Multi-Sig Consensus",
    penaltyPref: "Hard Deadline (Auto-Terminate)",
    ghostingTimelock: "3 Days",
    hostageTimelock: "7 Days"
  }
];

const MOCK_FREELANCERS = [
  {
    id: "FL-5021",
    name: "Alex Rustman",
    title: "Senior Soroban Dev",
    rate: "$80/hr",
    completed: 12,
    rating: 4.9,
    skills: ["Rust", "Soroban", "Stellar"]
  },
  {
    id: "FL-5022",
    name: "Sarah Design",
    title: "UI/UX & Frontend Engineer",
    rate: "$60/hr",
    completed: 34,
    rating: 5.0,
    skills: ["React", "Next.js", "Figma"]
  }
];

export function Dashboard({ pubKey, balance, initialRole = "freelancer", isEmbedded = false }: { pubKey: string | null; balance: string | null; initialRole?: "freelancer" | "client"; isEmbedded?: boolean }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [role, setRole] = useState<"freelancer" | "client">(initialRole);
  const { initEscrow, submitMilestone, approveMilestone, requestRevision, dispute, isTxPending } = useEscrowContract();
  
  // Sync tab with URL if available
  const tabQuery = searchParams?.get("tab") as "board" | "active" | "create" | "proposals" | "discover" | "workrooms" | "dashboard" | "workroom_detail" | "past" | null;
  const [activeTab, setActiveTab] = useState<"board" | "active" | "create" | "proposals" | "discover" | "workrooms" | "dashboard" | "workroom_detail" | "past">(tabQuery || "board");
  
  useEffect(() => {
    if (tabQuery) {
      setActiveTab(tabQuery);
    }
  }, [tabQuery]);
  
  // Job Board State
  const [jobs, setJobs] = useState<JobData[]>([]);
  const [freelancers, setFreelancers] = useState<any[]>([]);
  const [selectedJob, setSelectedJob] = useState<JobData | null>(null);
  const [talentSearch, setTalentSearch] = useState("");
  
  useEffect(() => {
    // Fetch Jobs
    const fetchJobs = async () => {
      try {
        const url = role === "client" && pubKey ? `/api/jobs?clientId=${pubKey}` : "/api/jobs";
        const res = await fetch(url);
        if (res.ok) setJobs(await res.json());
      } catch (e) { console.error("Error fetching jobs", e); }
    };
    fetchJobs();
  }, [role, pubKey]);

  useEffect(() => {
    // Fetch Freelancers
    const fetchFreelancers = async () => {
      try {
        const res = await fetch("/api/freelancers");
        if (res.ok) setFreelancers(await res.json());
      } catch (e) { console.error("Error fetching freelancers", e); }
    };
    fetchFreelancers();
  }, []);
  
  // Forms State
  const [newJob, setNewJob] = useState<Partial<JobData>>({
    escrowType: ESCROW_PREFS[0].value,
    disputePref: DISPUTE_ORACLES[0].value,
    penaltyPref: LATE_PENALTIES[0].value,
    paymentAsset: PAYMENT_ASSETS[0],
    timelineUnit: DELIVERY_UNITS[0],
    category: JOB_CATEGORIES[0],
    expectedRevisions: REVISIONS_OPTS[1],
    ghostingTimelock: "7 Days",
    hostageTimelock: "14 Days"
  });
  
  const [isEditingJob, setIsEditingJob] = useState<string | null>(null);

  // Counter Offer State
  const [counterMode, setCounterMode] = useState<ProposalData | null>(null);
  const [counterBidAmount, setCounterBidAmount] = useState("");
  const [counterDeliveryAmount, setCounterDeliveryAmount] = useState("");
  const [counterDeliveryUnit, setCounterDeliveryUnit] = useState(DELIVERY_UNITS[0]);
  const [counterRevisions, setCounterRevisions] = useState(REVISIONS_OPTS[1]);

  // Proposal State
  const [bidAmount, setBidAmount] = useState("");
  const [deliveryAmount, setDeliveryAmount] = useState("");
  const [deliveryUnit, setDeliveryUnit] = useState(DELIVERY_UNITS[0]);
  const [revisions, setRevisions] = useState(REVISIONS_OPTS[1]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [submittedProposals, setSubmittedProposals] = useState<ProposalData[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [commitMessage, setCommitMessage] = useState("");
  const [selectedMilestoneId, setSelectedMilestoneId] = useState<number | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedWorkroom, setSelectedWorkroom] = useState<ProposalData | null>(null);

  // AI Review States
  const [aiReviews, setAiReviews] = useState<Record<string, any>>({});
  const [loadingAiReview, setLoadingAiReview] = useState<Record<string, boolean>>({});

  // Review System States
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [hasSubmittedReview, setHasSubmittedReview] = useState(false);
  const [isReviewSubmitting, setIsReviewSubmitting] = useState(false);
  const [workroomFilter, setWorkroomFilter] = useState<"active" | "completed" | "disputed">("active");

  // Local proposal cache cleanup for outdated test job and bugged 'null' string proposals
  useEffect(() => {
    const saved = localStorage.getItem("trustflow_proposals");
    if (saved) {
      try {
        const proposals: ProposalData[] = JSON.parse(saved);
        // Filter out proposals with explicit "null" strings stored due to previous bugs
        const filtered = proposals.filter(p => {
            const hasNullArbitration = p.arbitration?.includes("null");
            const hasNullKillswitch = p.killSwitch?.includes("null");
            const isBadJob = p.jobId === "cmqyuqjd90002d5ucxi41kzmu";
            return !hasNullArbitration && !hasNullKillswitch && !isBadJob;
        });
        
        if (filtered.length !== proposals.length) {
          localStorage.setItem("trustflow_proposals", JSON.stringify(filtered));
          setSubmittedProposals(filtered);
          if (selectedWorkroom && !filtered.some(f => f.jobId === selectedWorkroom.jobId)) {
            setSelectedWorkroom(null);
            setActiveTab("workrooms");
          }
        }
      } catch (e) {}
    }
  }, [selectedWorkroom]);

  // Check if completed workroom has a review already submitted
  useEffect(() => {
    if (selectedWorkroom && selectedWorkroom.status === "COMPLETED") {
      fetch(`/api/users/${selectedWorkroom.freelancerAddress}/reviews`)
        .then(r => r.json())
        .then(data => {
          if (data && data.reviews) {
            const alreadyReviewed = data.reviews.some((r: any) => r.jobId === selectedWorkroom.jobId);
            setHasSubmittedReview(alreadyReviewed);
          }
        })
        .catch(e => console.error("Error loading review status:", e));
    }
  }, [selectedWorkroom]);

  const handleSendReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWorkroom) return;
    
    setIsReviewSubmitting(true);
    try {
      const response = await fetch(`/api/users/${selectedWorkroom.freelancerAddress}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rating: reviewRating,
          comment: reviewComment,
          jobId: selectedWorkroom.jobId,
          reviewerId: pubKey
        })
      });
      
      if (response.ok) {
        toast.success("Review submitted successfully! Thank you for your feedback.");
        setHasSubmittedReview(true);
        setReviewComment("");
      } else {
        const err = await response.json();
        toast.error(err.error || "Failed to submit review");
      }
    } catch (error) {
      console.error("Error submitting review:", error);
      toast.error("An error occurred. Please try again.");
    } finally {
      setIsReviewSubmitting(false);
    }
  };

  // Fetch AI reviews dynamically when a workroom is selected and has submitted milestones
  useEffect(() => {
    if (selectedWorkroom) {
      selectedWorkroom.milestones.forEach((m) => {
        if (m.status === "SUBMITTED") {
          const cacheKey = `${selectedWorkroom.jobId}-${m.id}`;
          if (!aiReviews[cacheKey] && !loadingAiReview[cacheKey]) {
            setLoadingAiReview(prev => ({ ...prev, [cacheKey]: true }));
            
            const jobDetail = jobs.find(j => j.id === selectedWorkroom.jobId) || {
              title: "Freelance Project",
              scope: selectedWorkroom.acceptanceCriteria || "No project scope details provided."
            };
            
            const deliveryNotes = m.commits?.map(c => c.message).join("\n\n") || "No delivery logs provided.";
            
            fetch("/api/ai-review", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                jobTitle: jobDetail.title,
                jobDescription: jobDetail.scope,
                milestoneDescription: m.name,
                deliveryNotes: deliveryNotes
              })
            })
              .then(r => r.json())
              .then(data => {
                if (data.success && data.review) {
                  setAiReviews(prev => ({ ...prev, [cacheKey]: data.review }));
                }
              })
              .catch(e => console.error("Error fetching AI review:", e))
              .finally(() => {
                setLoadingAiReview(prev => ({ ...prev, [cacheKey]: false }));
              });
          }
        }
      });
    }
  }, [selectedWorkroom, role, jobs, aiReviews, loadingAiReview]);

  // Fetch proposals from database
  const fetchProposals = async () => {
    try {
      const res = await fetch("/api/proposals");
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setSubmittedProposals(data.proposals);
        }
      }
    } catch (e) {
      console.error("Error fetching proposals:", e);
    }
  };

  useEffect(() => {
    fetchProposals();
    const interval = setInterval(fetchProposals, 5000); // 5 seconds polling
    return () => clearInterval(interval);
  }, []);

  // ---- Persistence Effects ----
  useEffect(() => {
    const savedJobs = localStorage.getItem("trustflow_jobs");
    if (savedJobs) {
      try { setJobs(JSON.parse(savedJobs)); } catch(e){}
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded && jobs !== MOCK_JOBS) {
      localStorage.setItem("trustflow_jobs", JSON.stringify(jobs));
    }
  }, [jobs, isLoaded]);

  // ---- Handlers ----

  const handlePostJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isEditingJob) {
      // Not yet implemented for API, just update local state for now
      setJobs(jobs.map(j => j.id === isEditingJob ? { ...j, ...newJob } as JobData : j));
      toast.success("Job updated successfully!");
      setIsEditingJob(null);
    } else {
      try {
        const payload = {
          title: newJob.title || "",
          category: newJob.category || JOB_CATEGORIES[0],
          scope: newJob.scope || "",
          budgetRange: newJob.budgetRange || "",
          paymentAsset: newJob.paymentAsset || PAYMENT_ASSETS[0],
          timelineAmount: newJob.timelineAmount || "",
          timelineUnit: newJob.timelineUnit || DELIVERY_UNITS[0],
          expectedRevisions: newJob.expectedRevisions || REVISIONS_OPTS[1],
          expertise: newJob.expertise || "",
          escrowType: newJob.escrowType || ESCROW_PREFS[0].value,
          disputePref: newJob.disputePref || DISPUTE_ORACLES[0].value,
          penaltyPref: newJob.penaltyPref || LATE_PENALTIES[0].value,
          ghostingTimelock: newJob.ghostingTimelock || "7 Days",
          hostageTimelock: newJob.hostageTimelock || "14 Days",
          clientId: pubKey // Client wallet address
        };
        
        const res = await fetch("/api/jobs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        
        if (res.ok) {
          const job = await res.json();
          setJobs([job, ...jobs]);
          toast.success("Job Posted successfully to the Job Board!");
        } else {
          const err = await res.json();
          toast.error(err.error || "Failed to post job");
        }
      } catch (err) {
        toast.error("Failed to post job");
        console.error(err);
      }
    }
    setNewJob({
      escrowType: ESCROW_PREFS[0].value,
      disputePref: DISPUTE_ORACLES[0].value,
      penaltyPref: LATE_PENALTIES[0].value,
      paymentAsset: PAYMENT_ASSETS[0],
      timelineUnit: DELIVERY_UNITS[0],
    category: JOB_CATEGORIES[0],
      expectedRevisions: REVISIONS_OPTS[1],
      ghostingTimelock: "7 Days",
      hostageTimelock: "14 Days"
    });
    setActiveTab("active");
  };

  const handleEditJob = (job: JobData) => {
    setNewJob(job);
    setIsEditingJob(job.id);
    setActiveTab("create");
  };

  const handleSelectJobForBid = (job: JobData) => {
    setSelectedJob(job);
    setRevisions(job.expectedRevisions || REVISIONS_OPTS[1]);
  };

  const handleAddMilestone = () => {
    setMilestones([...milestones, { id: milestones.length + 1, name: "", percentage: 0, amount: 0 }]);
  };

  const handleMilestoneChange = (index: number, field: keyof Milestone, value: string | number) => {
    const updated = [...milestones];
    updated[index] = { ...updated[index], [field]: value };
    setMilestones(updated);
  };

  const handleRemoveMilestone = (index: number) => {
    setMilestones(milestones.filter((_, i) => i !== index));
  };

  const handleSendProposal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedJob) return;

    // Validate Milestones
    const totalPercentage = milestones.reduce((sum, m) => sum + Number(m.percentage), 0);
    if (milestones.length > 0 && totalPercentage !== 100) {
      toast.error(`Milestone percentages must equal 100%. Current: ${totalPercentage}%`);
      return;
    }

    setShowConfirmModal(true);
  };

  const executeSendProposal = () => {
    setShowConfirmModal(false);
    if (!selectedJob) return;

    // Calculate actual amounts for milestones to fix the UI bug
    const finalMilestones = milestones.length > 0 
      ? milestones.map(m => ({ 
          ...m, 
          amount: bidAmount && m.percentage ? (Number(bidAmount) * m.percentage) / 100 : 0 
        }))
      : [{ id: 1, name: "Final Delivery", percentage: 100, amount: Number(bidAmount) }];

    const proposal: ProposalData = {
      jobId: selectedJob.id,
      freelancerAddress: pubKey || "UNKNOWN_ADDRESS",
      status: "PENDING_CLIENT",
      hashAnchor: "sha256:8f434346648f6b96df89dda901c5176b...",
      paymentAsset: selectedJob.paymentAsset || "USDC",
      milestones: finalMilestones,
      timeLocks: `${deliveryAmount} ${deliveryUnit} (Absolute UTC Timestamp)`,
      acceptanceCriteria: "Delivery logged on-chain. Client has 72h Grace Period to review.",
      revisions: revisions,
      reporting: "GitHub Commits & Soroban State Updates",
      escrowInit: "Work begins ONLY after funds are locked in Soroban. Time = env.ledger().timestamp()",
      arbitration: `${selectedJob.disputePref || "Decentralized Arbitrator"} (Fallback: 50/50 Split after 7 days timeout)`,
      killSwitch: `${selectedJob.penaltyPref || "Strict Policy"} (10% Slashing applied if within 24h Grace Period)`,
      ghostingClause: `If freelancer does not deliver by Deadline + 24h Grace Period, funds Auto-Refund.`,
      hostageClause: `If Client ghosts for 72h post-delivery, funds Auto-Release to Freelancer.`,
      ipRights: "IP transfers to Client strictly upon 100% smart contract payout.",
      nda: "Standard mutual NDA applied via on-chain hash signature."
    };

    // Update locally for instant feedback
    setSubmittedProposals([...submittedProposals, proposal]);
    
    // Sync to DB
    fetch("/api/proposals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(proposal)
    }).then(() => fetchProposals());

    toast.success("Programmatic 14-Point Proposal sent to Client!");
    setSelectedJob(null);
    setMilestones([]);
    setBidAmount("");
    setDeliveryAmount("");
  };

  const handleSelectJobForProposal = (job: JobData) => {
    setSelectedJob(job);
    const safeBudgetRange = job.budgetRange || (job.budget ? String(job.budget) : "0");
    const numMatch = safeBudgetRange.replace(/,/g, '').match(/\d+/g);
    if (numMatch) {
      setBidAmount(numMatch[numMatch.length - 1]);
    }
    setDeliveryAmount(job.timelineAmount || "14");
    if (job.timelineUnit && DELIVERY_UNITS.includes(job.timelineUnit)) {
      setDeliveryUnit(job.timelineUnit);
    } else {
      setDeliveryUnit("Days");
    }
    setRevisions(job.expectedRevisions || "2");
  };

  const handleFundEscrow = async (prop: ProposalData) => {
    try {
      const amountXlm = prop.milestones.reduce((sum, m) => sum + m.amount, 0);
      
      const amountsXlm = prop.milestones.length > 0 ? prop.milestones.map(m => m.amount) : [amountXlm];
      // Basic mock deadline (14 days from now)
      const mockDeadlineMs = Date.now() + 14 * 24 * 60 * 60 * 1000;
      const deadlinesMs = prop.milestones.length > 0 ? prop.milestones.map(() => mockDeadlineMs) : [mockDeadlineMs];
      
      let revLimit = 0;
      if (prop.revisions.includes("1")) revLimit = 1;
      else if (prop.revisions.includes("2")) revLimit = 2;
      else if (prop.revisions.includes("3")) revLimit = 3;
      else if (prop.revisions.includes("Unlimited")) revLimit = 99;

      toast.loading("Preparing transaction and waiting for signature...", { id: "escrow_tx" });
      await initEscrow(prop.jobId, prop.freelancerAddress, amountsXlm, deadlinesMs, revLimit);
      toast.success("Funds locked in Soroban Smart Contract!", { id: "escrow_tx" });
      
      const updatedProp = { ...prop, status: "ACCEPTED" as const };
      setSubmittedProposals(submittedProposals.map(p => p.jobId === prop.jobId ? updatedProp : p));
      
      fetch(`/api/proposals/${prop.id || prop.jobId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedProp)
      }).then(() => fetchProposals());
      
    } catch (error: any) {
      if (error.message?.includes("#1")) {
        toast.success("Escrow already funded on network. Syncing UI...", { id: "escrow_tx" });
        const updatedProp = { ...prop, status: "ACCEPTED" as const };
        setSubmittedProposals(submittedProposals.map(p => p.jobId === prop.jobId ? updatedProp : p));
        
        fetch(`/api/proposals/${prop.id || prop.jobId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updatedProp)
        }).then(() => fetchProposals());
      } else {
        toast.error(`Escrow funding failed: ${error.message || error}`, { id: "escrow_tx" });
      }
    }
  };

  const initCounterOffer = (prop: ProposalData) => {
    setCounterMode(prop);
    setCounterBidAmount(String(prop.milestones.reduce((sum, m) => sum + m.amount, 0)));
    setCounterRevisions(prop.revisions);
    setCounterDeliveryAmount((prop.timeLocks || "14 Days").split(" ")[0]);
    setCounterDeliveryUnit((prop.timeLocks || "14 Days").split(" ")[1]);
  };

  const handleSendCounter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!counterMode) return;

    // Recalculate milestone amounts based on new counterBidAmount
    const finalMilestones = counterMode.milestones.length > 0
      ? counterMode.milestones.map(m => ({
          ...m,
          amount: counterBidAmount && m.percentage ? (Number(counterBidAmount) * m.percentage) / 100 : (counterMode.milestones.length === 1 ? Number(counterBidAmount) : m.amount)
        }))
      : [{ id: 1, name: "Final Delivery", percentage: 100, status: "PENDING" as const, amount: Number(counterBidAmount) }];

    // Update the submitted proposal array locally
    const updatedProposal: ProposalData = {
      ...counterMode,
      milestones: finalMilestones,
      paymentAsset: counterMode.paymentAsset || "USDC",
      timeLocks: `${counterDeliveryAmount} ${counterDeliveryUnit} (Absolute UTC Timestamp)`,
      revisions: counterRevisions,
      status: role === "client" ? "PENDING_FL" : "PENDING_CLIENT"
    };

    setSubmittedProposals(submittedProposals.map(p => p.jobId === counterMode.jobId ? updatedProposal : p));
    
    // Sync to DB
    fetch(`/api/proposals/${counterMode.id || counterMode.jobId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updatedProposal)
    }).then(async r => {
      const data = await r.json();
      if (!data.success) toast.error("Counter offer sync failed: " + data.error);
      else fetchProposals();
    }).catch(e => toast.error("Sync error: " + e.message));

    toast.success(role === "client" ? "Counter Offer Sent! Waiting for Freelancer to sign." : "Counter Offer Sent! Waiting for Client to sign.");
    setCounterMode(null);
  };

  const selectStyle = "flex h-10 w-full rounded-md border border-input bg-black/50 px-3 py-2 text-sm text-white border-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";

  // Phase 5: Workroom Operations
  const handleSubmitMilestone = async (mId: number, index: number) => {
    if (!selectedWorkroom) return;
    try {
      await submitMilestone(selectedWorkroom.jobId, index);
      const updatedProposals = submittedProposals.map(p => {
        if (p.jobId === selectedWorkroom.jobId) {
          const updatedMilestones = p.milestones.map(mile => mile.id === mId ? { ...mile, status: "SUBMITTED" as const } : mile);
          const isLast = p.milestones[p.milestones.length - 1].id === mId;
          return { ...p, milestones: updatedMilestones, status: isLast ? "DELIVERED" : p.status };
        }
        return p;
      });
      setSubmittedProposals(updatedProposals);
      const updatedWorkroom = updatedProposals.find(p => p.jobId === selectedWorkroom.jobId);
      if (updatedWorkroom) {
        setSelectedWorkroom(updatedWorkroom);
        if (updatedWorkroom.id) {
          fetch(`/api/proposals/${updatedWorkroom.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(updatedWorkroom)
          }).then(() => fetchProposals());
        }
      }
      toast.success("Milestone submitted to smart contract!");
    } catch (e: any) {
      if (e.message?.includes("#5")) {
        toast.success("Milestone already submitted on network. Syncing UI...");
        const updatedProposals = submittedProposals.map(p => {
          if (p.jobId === selectedWorkroom.jobId) {
            const updatedMilestones = p.milestones.map(mile => mile.id === mId ? { ...mile, status: "SUBMITTED" as const } : mile);
            const isLast = p.milestones[p.milestones.length - 1].id === mId;
            return { ...p, milestones: updatedMilestones, status: isLast ? "DELIVERED" : p.status };
          }
          return p;
        });
        setSubmittedProposals(updatedProposals);
        const updatedWorkroom = updatedProposals.find(p => p.jobId === selectedWorkroom.jobId);
        if (updatedWorkroom) {
          setSelectedWorkroom(updatedWorkroom);
          if (updatedWorkroom.id) {
            fetch(`/api/proposals/${updatedWorkroom.id}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(updatedWorkroom)
            }).then(() => fetchProposals());
          }
        }
      } else {
        toast.error(e.message);
      }
    }
  };

  const handleApproveMilestone = async (mId: number, index: number) => {
    if (!selectedWorkroom) return;
    try {
      await approveMilestone(selectedWorkroom.jobId, index);
      const updatedProposals = submittedProposals.map(p => {
        if (p.jobId === selectedWorkroom.jobId) {
          const updatedMilestones = p.milestones.map(mile => mile.id === mId ? { ...mile, status: "APPROVED" as const } : mile);
          const allApproved = updatedMilestones.every(m => m.status === "APPROVED");
          return { ...p, milestones: updatedMilestones, status: allApproved ? "COMPLETED" : p.status };
        }
        return p;
      });
      setSubmittedProposals(updatedProposals);
      const updatedWorkroom = updatedProposals.find(p => p.jobId === selectedWorkroom.jobId);
      if (updatedWorkroom) {
        setSelectedWorkroom(updatedWorkroom);
        if (updatedWorkroom.id) {
          fetch(`/api/proposals/${updatedWorkroom.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(updatedWorkroom)
          }).then(() => fetchProposals());
        }
      }
      toast.success("Milestone approved and funds released!");
    } catch (e: any) {
      if (e.message?.includes("#5")) {
        toast.success("Milestone already approved on network. Syncing UI...");
        const updatedProposals = submittedProposals.map(p => {
          if (p.jobId === selectedWorkroom.jobId) {
            const updatedMilestones = p.milestones.map(mile => mile.id === mId ? { ...mile, status: "APPROVED" as const } : mile);
            const allApproved = updatedMilestones.every(m => m.status === "APPROVED");
            return { ...p, milestones: updatedMilestones, status: allApproved ? "COMPLETED" : p.status };
          }
          return p;
        });
        setSubmittedProposals(updatedProposals);
        const updatedWorkroom = updatedProposals.find(p => p.jobId === selectedWorkroom.jobId);
        if (updatedWorkroom) {
          setSelectedWorkroom(updatedWorkroom);
          if (updatedWorkroom.id) {
            fetch(`/api/proposals/${updatedWorkroom.id}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(updatedWorkroom)
            }).then(() => fetchProposals());
          }
        }
      } else {
        toast.error(e.message);
      }
    }
  };

  const handleRequestRevision = async (mId: number, index: number) => {
    if (!selectedWorkroom) return;
    try {
      await requestRevision(selectedWorkroom.jobId, index);
      const updatedProposals = submittedProposals.map(p => {
        if (p.jobId === selectedWorkroom.jobId) {
          const updatedMilestones = p.milestones.map(mile => mile.id === mId ? { ...mile, status: "REVISION_REQUESTED" as const } : mile);
          return { ...p, milestones: updatedMilestones };
        }
        return p;
      });
      setSubmittedProposals(updatedProposals);
      const updatedWorkroom = updatedProposals.find(p => p.jobId === selectedWorkroom.jobId);
      if (updatedWorkroom) {
        setSelectedWorkroom(updatedWorkroom);
        if (updatedWorkroom.id) {
          fetch(`/api/proposals/${updatedWorkroom.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(updatedWorkroom)
          }).then(() => fetchProposals());
        }
      }
      toast.success("Revision requested on-chain!");
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleDispute = async (mId: number, index: number) => {
    if (!selectedWorkroom) return;
    try {
      await dispute(selectedWorkroom.jobId, index);
      
      const updatedProposals = submittedProposals.map(p => 
        p.jobId === selectedWorkroom.jobId ? { ...p, status: "DISPUTED" as const } : p
      );
      setSubmittedProposals(updatedProposals);
      const updatedWorkroom = updatedProposals.find(p => p.jobId === selectedWorkroom.jobId);
      
      if (updatedWorkroom) {
        setSelectedWorkroom(updatedWorkroom);
        if (updatedWorkroom.id) {
          fetch(`/api/proposals/${updatedWorkroom.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(updatedWorkroom)
          }).then(() => fetchProposals());
        }
      }
      
      toast.success("Dispute initiated on-chain!");
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  // UI Render functionsStyle = "flex h-10 w-full rounded-md border border-input bg-black/50 px-3 py-2 text-sm text-white border-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";

  return (
    <div className="w-full max-w-6xl mx-auto space-y-8 pb-20 pt-10 px-4 sm:px-6 lg:px-8 min-h-[800px]">
      
      {!isEmbedded && (
        <div className="flex justify-center mb-10">
          <div className="bg-zinc-900/80 p-1 rounded-2xl flex flex-wrap sm:flex-nowrap border border-white/5 backdrop-blur-md">
            <button 
              onClick={() => { setRole("freelancer"); setActiveTab("board"); setSelectedJob(null); }}
              className={`px-4 sm:px-8 py-2.5 sm:py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 text-sm sm:text-base ${role === "freelancer" ? "bg-green-500 text-black shadow-[0_0_15px_rgba(34,197,94,0.3)]" : "text-zinc-400 hover:text-white"}`}
            >
              <UserCircle className="w-5 h-5" /> Freelancer Mode
            </button>
            <button 
              onClick={() => { setRole("client"); setActiveTab("active"); setSelectedJob(null); }}
              className={`px-4 sm:px-8 py-2.5 sm:py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 text-sm sm:text-base ${role === "client" ? "bg-blue-500 text-black shadow-[0_0_15px_rgba(59,130,246,0.3)]" : "text-zinc-400 hover:text-white"}`}
            >
              <Briefcase className="w-5 h-5" /> Client Mode
            </button>
          </div>
        </div>
      )}

      <AnimatePresence mode="wait">
        
        {/* ================= FREELANCER MODE ================= */}
        {role === "freelancer" && (
          <motion.div 
            key="freelancer"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-6"
          >
            {/* If not embedded, show the top tab bar. */}
            {!isEmbedded && (
              <div className="flex flex-wrap gap-2 sm:gap-4 border-b border-white/10 pb-4 mb-4">
                <button onClick={() => {setActiveTab("board"); setCounterMode(null);}} className={`font-semibold pb-2 border-b-2 transition-all text-sm sm:text-base ${activeTab === "board" ? "border-green-500 text-white" : "border-transparent text-zinc-500 hover:text-zinc-300"}`}>Job Board</button>
                <button onClick={() => {setActiveTab("active"); setCounterMode(null);}} className={`font-semibold pb-2 border-b-2 transition-all text-sm sm:text-base ${activeTab === "active" ? "border-green-500 text-white" : "border-transparent text-zinc-500 hover:text-zinc-300"}`}>
                  Pending Proposals <span className="bg-green-500/20 text-green-400 text-xs px-2 py-0.5 rounded-full ml-1">{submittedProposals.filter(p => p.status.startsWith("PENDING")).length}</span>
                </button>
                <button onClick={() => {setActiveTab("workrooms"); setCounterMode(null);}} className={`font-semibold pb-2 border-b-2 transition-all text-sm sm:text-base ${activeTab === "workrooms" ? "border-green-500 text-white" : "border-transparent text-zinc-500 hover:text-zinc-300"}`}>
                  My Workrooms <span className="bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full ml-1">{submittedProposals.filter(p => ["ACCEPTED", "DELIVERED", "COMPLETED", "DISPUTED"].includes(p.status)).length}</span>
                </button>
              </div>
            )}

            {/* View: Job Board List */}
            {activeTab === "board" && !selectedJob && (
               <div className="space-y-6">
                 {/* Category Filters */}
                 <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                   <button 
                     onClick={() => setSelectedCategory("All")}
                     className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-bold transition-all ${selectedCategory === "All" ? "bg-white text-black" : "bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10 border border-white/10"}`}
                   >
                     All Jobs
                   </button>
                   {JOB_CATEGORIES.map(cat => (
                     <button 
                       key={cat}
                       onClick={() => setSelectedCategory(cat)}
                       className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-bold transition-all ${selectedCategory === cat ? "bg-white text-black" : "bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10 border border-white/10"}`}
                     >
                       {cat}
                     </button>
                   ))}
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                   {(selectedCategory === "All" ? jobs : jobs.filter(j => j.category === selectedCategory))
                     .filter(job => !submittedProposals.some(p => p.jobId === job.id && ["ACCEPTED", "DELIVERED", "COMPLETED"].includes(p.status)))
                     .map((job) => (

                   <motion.div key={job.id} whileHover={{ y: -5 }} className="bg-zinc-900/50 border border-white/10 p-5 rounded-2xl cursor-pointer hover:border-green-500/50 transition-all group flex flex-col justify-between" onClick={() => handleSelectJobForProposal(job)}>
                     <div>
                       <div className="flex justify-between items-start mb-4">
                         <div className="bg-green-500/10 text-green-400 text-xs font-bold px-2 py-1 rounded">{job.expertise}</div>
                         <span className="text-zinc-500 text-xs flex items-center gap-1"><Calendar className="w-3 h-3"/> {job.timelineAmount} {job.timelineUnit}</span>
                       </div>
                       <h3 className="text-lg font-bold text-white mb-2 group-hover:text-green-400 transition-colors truncate" title={job.title}>{job.title}</h3>
                       <p className="text-sm text-zinc-400 line-clamp-2 break-words mb-4" title={job.scope}>{job.scope}</p>
                     </div>
                     <div className="flex justify-between items-center border-t border-white/5 pt-4">
                       <span className="font-mono text-zinc-300 font-bold flex items-center gap-1"><DollarSign className="w-4 h-4 text-zinc-500"/> {job.budgetRange} <span className="text-xs font-normal text-zinc-500">{(job.paymentAsset || "USDC").split(" ")[0]}</span></span>
                       <Button variant="ghost" onClick={(e) => { e.stopPropagation(); handleSelectJobForBid(job); }} className="text-green-500 hover:bg-green-500/10 hover:text-green-400">View & Bid</Button>
                     </div>
                   </motion.div>
                 ))}
               </div>
               </div>
            )}

            {/* View: Create Proposal Form (Freelancer logic) */}
            {activeTab === "board" && selectedJob && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                <Button variant="ghost" onClick={() => setSelectedJob(null)} className="text-zinc-400 hover:text-white mb-2">← Back to Job Board</Button>
                
                {/* Client's Requirements Card */}
                <div className="bg-blue-950/20 border border-blue-500/20 p-6 rounded-2xl space-y-4">
                  <h3 className="text-lg font-bold text-blue-400 flex items-center gap-2">Client's Job & Rules</h3>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div><span className="text-xs text-zinc-500 block">Client Budget</span><span className="text-sm text-white font-bold">{selectedJob.budgetRange} {selectedJob.paymentAsset}</span></div>
                    <div><span className="text-xs text-zinc-500 block">Expected Delivery</span><span className="text-sm text-white">{selectedJob.timelineAmount} {selectedJob.timelineUnit}</span></div>
                    <div><span className="text-xs text-zinc-500 block">Escrow Pref</span><span className="text-sm text-white">{selectedJob.escrowType}</span></div>
                    <div><span className="text-xs text-zinc-500 block">Penalty Rule</span><span className="text-sm text-red-400">{selectedJob.penaltyPref}</span></div>
                    <div><span className="text-xs text-zinc-500 block">Dispute Rule</span><span className="text-sm text-white">{selectedJob.disputePref}</span></div>
                  </div>
                  <div className="bg-black/50 p-3 rounded-lg border border-white/5 text-sm text-zinc-300 mt-2">
                    {selectedJob.scope}
                  </div>
                </div>

                <form onSubmit={handleSendProposal} className="bg-zinc-900/40 p-6 rounded-2xl border border-white/5 space-y-8">
                  <div>
                    <h3 className="text-xl font-bold text-white">Draft Your Proposal</h3>
                    <p className="text-sm text-zinc-400">Set your bid, timeline, and programmatic milestone structure.</p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <Label className="text-zinc-400">Your Bid (Total {selectedJob.paymentAsset})</Label>
                      <Input required type="number" placeholder="e.g. 10000" value={bidAmount} onChange={e => setBidAmount(e.target.value)} className="bg-black/50 border-white/10 text-white focus-visible:ring-green-500 text-lg font-mono" />
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-zinc-400">Delivery Time</Label>
                      <div className="flex gap-2">
                        <Input required type="number" placeholder="e.g. 14" value={deliveryAmount} onChange={e => setDeliveryAmount(e.target.value)} className="bg-black/50 border-white/10 text-white focus-visible:ring-green-500" />
                        <select required className={`${selectStyle} w-32 focus-visible:ring-green-500`}
                          value={deliveryUnit}
                          onChange={e => setDeliveryUnit(e.target.value)}
                        >
                          {DELIVERY_UNITS.map(u => <option key={u} value={u} className="bg-zinc-900 text-white">{u}</option>)}
                        </select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-zinc-400">Revisions Included</Label>
                      <select required className={`${selectStyle} focus-visible:ring-green-500`}
                          value={revisions}
                          onChange={e => setRevisions(e.target.value)}
                        >
                          {REVISIONS_OPTS.map(r => <option key={r} value={r} className="bg-zinc-900 text-white">{r}</option>)}
                      </select>
                    </div>
                  </div>

                  {/* Programmatic Milestones Builder */}
                  <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center border-b border-white/10 pb-2 gap-3">
                      <Label className="text-zinc-300 text-lg">Programmatic Milestones</Label>
                      <Button type="button" onClick={handleAddMilestone} variant="outline" className="w-full sm:w-auto text-xs py-1 h-8 border-green-500/30 text-green-400 hover:bg-green-500/10">
                        + Add Milestone
                      </Button>
                    </div>
                    
                    {milestones.length === 0 ? (
                      <div className="text-center p-6 border border-dashed border-white/10 rounded-xl text-zinc-500 text-sm">
                        No milestones added. 100% of funds will be released upon final delivery.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {milestones.map((m, idx) => (
                          <div key={idx} className="flex items-center gap-4 bg-black/40 p-3 rounded-xl border border-white/5">
                            <span className="font-mono text-zinc-500 w-6">#{idx + 1}</span>
                            <Input 
                              placeholder="e.g. Figma Design Approval" 
                              value={m.name} 
                              onChange={e => handleMilestoneChange(idx, "name", e.target.value)} 
                              className="bg-zinc-900 border-none text-white focus-visible:ring-1 focus-visible:ring-green-500"
                              required
                            />
                            <div className="flex items-center gap-2">
                              <Input 
                                type="number" 
                                placeholder="%" 
                                value={m.percentage || ""} 
                                onChange={e => handleMilestoneChange(idx, "percentage", Number(e.target.value))} 
                                className="w-20 bg-zinc-900 border-none text-white focus-visible:ring-1 focus-visible:ring-green-500 text-center"
                                required
                                min="1" max="100"
                              />
                              <span className="text-zinc-500">%</span>
                            </div>
                            <div className="w-32 text-right font-mono text-sm text-green-400">
                              {bidAmount && m.percentage ? ((Number(bidAmount) * m.percentage) / 100).toLocaleString() : "0"} {(selectedJob.paymentAsset || "USDC").split(" ")[0]}
                            </div>
                            <Button type="button" variant="ghost" onClick={() => handleRemoveMilestone(idx)} className="text-red-400 hover:bg-red-500/20 px-2">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="bg-green-950/20 p-4 rounded-xl border border-green-500/20 flex flex-col sm:flex-row items-start sm:items-center gap-4 justify-between mt-6">
                    <div className="flex-1">
                      <h4 className="text-green-400 font-bold text-sm">Automated Legal Standard Attached</h4>
                      <p className="text-xs text-zinc-400 mt-1">Gas Fees (Client Pays via Fee-Bump), IP Rights transfer, and Ghosting clauses automatically applied.</p>
                    </div>
                    <Button type="submit" className="w-full sm:w-auto bg-green-600 hover:bg-green-500 text-black font-bold px-8 shrink-0"><FileCode2 className="w-4 h-4 mr-2" /> Sign & Send Proposal</Button>
                  </div>
                </form>
              </motion.div>
            )}

            {/* View: Pending Proposals (FL) */}
            {activeTab === "active" && (
              <div className="space-y-10">
                {submittedProposals.filter(p => p.status.startsWith("PENDING")).length === 0 ? (
                  <div className="text-center py-20 bg-zinc-900/20 rounded-3xl border border-dashed border-white/10">
                     <Search className="w-10 h-10 text-zinc-600 mx-auto mb-4" />
                     <h3 className="text-xl font-bold text-zinc-400">No pending proposals</h3>
                     <p className="text-zinc-500 mt-2">Send proposals on the Job Board to secure work!</p>
                  </div>
                ) : (
                  submittedProposals.filter(p => p.status.startsWith("PENDING")).map((prop, i) => (
                    <div key={i} className="space-y-4">
                      <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full animate-pulse ${prop.status === "PENDING_FL" ? "bg-amber-500" : "bg-emerald-500"}`}></span> 
                        {prop.status === "PENDING_FL" ? "Counter Offer Received" : "Submitted Proposal"} for Job: {prop.jobId}
                      </h3>
                      {counterMode && counterMode.jobId === prop.jobId ? (
                        <motion.form onSubmit={handleSendCounter} initial={{opacity:0, scale: 0.95}} animate={{opacity:1, scale: 1}} className="bg-blue-950/20 p-6 rounded-2xl border border-blue-500/20 space-y-6">
                          <div>
                            <h3 className="text-xl font-bold text-blue-400">Counter Offer (Pazarlık Modu)</h3>
                            <p className="text-sm text-zinc-400">Send terms back to the Client.</p>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="space-y-2">
                              <Label className="text-zinc-400">Total Bid Amount</Label>
                              <Input required type="number" value={counterBidAmount} onChange={e => setCounterBidAmount(e.target.value)} className="bg-black/50 border-white/10 text-white focus-visible:ring-blue-500 text-lg font-mono" />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-zinc-400">Delivery Timeline</Label>
                              <div className="flex gap-2">
                                <Input required type="number" value={counterDeliveryAmount} onChange={e => setCounterDeliveryAmount(e.target.value)} className="bg-black/50 border-white/10 text-white focus-visible:ring-blue-500" />
                                <select required className={`${selectStyle} w-32 focus-visible:ring-blue-500`} value={counterDeliveryUnit} onChange={e => setCounterDeliveryUnit(e.target.value)}>
                                  {DELIVERY_UNITS.map(u => <option key={u} value={u} className="bg-zinc-900 text-white">{u}</option>)}
                                </select>
                              </div>
                            </div>
                            <div className="space-y-2">
                              <Label className="text-zinc-400">Revisions Needed</Label>
                              <select required className={`${selectStyle} focus-visible:ring-blue-500`} value={counterRevisions} onChange={e => setCounterRevisions(e.target.value)}>
                                  {REVISIONS_OPTS.map(r => <option key={r} value={r} className="bg-zinc-900 text-white">{r}</option>)}
                              </select>
                            </div>
                          </div>
                          <div className="flex justify-end gap-3 pt-4 border-t border-blue-500/10">
                            <Button type="button" variant="ghost" onClick={() => setCounterMode(null)} className="text-zinc-400 hover:text-white">Cancel</Button>
                            <Button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white"><Send className="w-4 h-4 mr-2" /> Send Counter</Button>
                          </div>
                        </motion.form>
                      ) : (
                        <ContractTemplate 
                            data={prop}
                            viewMode="freelancer"
                            onAction={() => {
                              if (prop.status === "PENDING_FL") {
                                setSubmittedProposals(submittedProposals.map(p => p.jobId === prop.jobId ? { ...p, status: "ACCEPTED" } : p));
                                toast.success("Counter Offer Signed! Contract is now locked.");
                                setActiveTab("workrooms");
                              } else {
                                toast.info("Waiting for Client to fund the escrow.");
                              }
                            }}
                            actionText={prop.status === "PENDING_FL" ? "Sign & Accept Counter Offer" : ["ACCEPTED", "DELIVERED"].includes(prop.status) ? "View Workroom" : "Waiting for Client"}
                            onDecline={prop.status === "PENDING_FL" ? () => toast.info("Proposal Withdrawn") : undefined}
                            onCounterOffer={prop.status === "PENDING_FL" ? () => initCounterOffer(prop) : undefined}
                        />
                      )}
                    </div>
                  ))
                )}
              </div>
            )}

            {/* View: Unified Workrooms (FL) */}
            {activeTab === "workrooms" && (
              <div className="space-y-6">
                <div className="flex gap-2 mb-6">
                   <button onClick={() => setWorkroomFilter("active")} className={`px-4 py-2 rounded-full text-sm font-bold transition-colors border ${workroomFilter === "active" ? "bg-blue-500/20 text-blue-400 border-blue-500/50" : "bg-black/50 text-zinc-500 border-white/5 hover:text-white"}`}>Active</button>
                   <button onClick={() => setWorkroomFilter("completed")} className={`px-4 py-2 rounded-full text-sm font-bold transition-colors border ${workroomFilter === "completed" ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/50" : "bg-black/50 text-zinc-500 border-white/5 hover:text-white"}`}>Completed</button>
                   <button onClick={() => setWorkroomFilter("disputed")} className={`px-4 py-2 rounded-full text-sm font-bold transition-colors border ${workroomFilter === "disputed" ? "bg-red-500/20 text-red-400 border-red-500/50" : "bg-black/50 text-zinc-500 border-white/5 hover:text-white"}`}>Disputed</button>
                </div>
                
                {(() => {
                   const filteredProps = submittedProposals.filter(p => {
                      if (workroomFilter === "active") return ["ACCEPTED", "DELIVERED"].includes(p.status);
                      if (workroomFilter === "completed") return p.status === "COMPLETED";
                      if (workroomFilter === "disputed") return p.status === "DISPUTED";
                      return false;
                   });
                   
                   if (filteredProps.length === 0) {
                      return (
                        <div className="text-center py-20 bg-zinc-900/20 rounded-3xl border border-dashed border-white/10">
                          <Briefcase className="w-10 h-10 text-zinc-600 mx-auto mb-4" />
                          <h3 className="text-xl font-bold text-zinc-400">No {workroomFilter} jobs</h3>
                          <p className="text-zinc-500 mt-2">Check back later or filter by another status.</p>
                        </div>
                      );
                   }
                   
                   return (
                     <div className="grid grid-cols-1 gap-6">
                       {filteredProps.map((prop, i) => (
                          <div key={i} className={`bg-zinc-900/50 border p-5 rounded-2xl transition-colors ${
                            prop.status === "DISPUTED" ? "border-red-500/30 hover:border-red-500/50" : 
                            prop.status === "COMPLETED" ? "border-emerald-500/30 hover:border-emerald-500/50" :
                            "border-blue-500/30 hover:border-blue-500/50"
                          }`}>
                            <div className="flex justify-between items-start mb-4">
                              <div>
                                <h4 className="text-lg font-bold text-white flex items-center gap-2">
                                  <span className={`w-2 h-2 rounded-full ${
                                    prop.status === "DISPUTED" ? "bg-red-500" : 
                                    prop.status === "COMPLETED" ? "bg-emerald-500" :
                                    "bg-blue-500 animate-pulse"
                                  }`}></span>
                                  Job ID: {prop.jobId}
                                </h4>
                              </div>
                              <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                                prop.status === "DISPUTED" ? "bg-red-500/20 text-red-400 border border-red-500/30" : 
                                prop.status === "COMPLETED" ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" :
                                "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                              }`}>
                                {prop.status}
                              </span>
                            </div>
                            <ContractTemplate 
                                data={prop}
                                viewMode="freelancer"
                                onAction={() => { setSelectedWorkroom(prop); setActiveTab("workroom_detail"); }}
                                actionText={workroomFilter === "active" ? "Open Workroom" : "View Details"}
                            />
                          </div>
                       ))}
                     </div>
                   );
                })()}
              </div>
            )}
          </motion.div>
        )}

        {/* ================= CLIENT MODE ================= */}
        {role === "client" && (
          <motion.div 
            key="client"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            {/* If not embedded, show the top tab bar. If embedded, the Layout sidebar handles navigation, so we only show the "Post New Job" button. */}
            {!isEmbedded && (
              <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4 border-b border-white/10 pb-4 mb-4">
                <div className="flex flex-wrap gap-2 sm:gap-4">
                  <button onClick={() => {setActiveTab("active"); setIsEditingJob(null);}} className={`font-semibold pb-2 border-b-2 transition-all text-sm sm:text-base ${activeTab === "active" ? "border-blue-500 text-white" : "border-transparent text-zinc-500 hover:text-zinc-300"}`}>My Posted Jobs</button>
                  <button onClick={() => {setActiveTab("proposals"); setIsEditingJob(null); setCounterMode(null);}} className={`font-semibold pb-2 border-b-2 transition-all text-sm sm:text-base ${activeTab === "proposals" ? "border-blue-500 text-white" : "border-transparent text-zinc-500 hover:text-zinc-300"}`}>
                    Pending Proposals <span className="bg-amber-500 text-white text-xs px-2 py-0.5 rounded-full ml-1">{submittedProposals.filter(p => p.status.startsWith("PENDING")).length}</span>
                  </button>
                  <button onClick={() => {setActiveTab("workrooms"); setIsEditingJob(null); setCounterMode(null);}} className={`font-semibold pb-2 border-b-2 transition-all text-sm sm:text-base ${activeTab === "workrooms" ? "border-blue-500 text-white" : "border-transparent text-zinc-500 hover:text-zinc-300"}`}>
                    Workrooms <span className="bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full ml-1">{submittedProposals.filter(p => ["ACCEPTED", "DELIVERED"].includes(p.status)).length}</span>
                  </button>
                  <button onClick={() => {setActiveTab("past"); setIsEditingJob(null); setCounterMode(null);}} className={`font-semibold pb-2 border-b-2 transition-all text-sm sm:text-base ${activeTab === "past" ? "border-blue-500 text-white" : "border-transparent text-zinc-500 hover:text-zinc-300"}`}>
                    Past Jobs <span className="bg-zinc-500 text-white text-xs px-2 py-0.5 rounded-full ml-1">{submittedProposals.filter(p => ["COMPLETED", "DISPUTED"].includes(p.status)).length}</span>
                  </button>
                  <button onClick={() => {setActiveTab("discover"); setIsEditingJob(null); setCounterMode(null);}} className={`font-semibold pb-2 border-b-2 transition-all text-sm sm:text-base ${activeTab === "discover" ? "border-blue-500 text-white" : "border-transparent text-zinc-500 hover:text-zinc-300"}`}>
                    Discover Talent <span className="text-xs bg-gradient-to-r from-blue-500 to-emerald-500 text-white px-2 py-0.5 rounded-full ml-1 font-bold animate-pulse">NEW</span>
                  </button>
                </div>
                <Button onClick={() => {
                  setNewJob({
                    escrowType: ESCROW_PREFS[0].value,
                    disputePref: DISPUTE_ORACLES[0].value,
                    penaltyPref: LATE_PENALTIES[0].value,
                    paymentAsset: PAYMENT_ASSETS[0],
                    timelineUnit: DELIVERY_UNITS[0],
    category: JOB_CATEGORIES[0],
                    expectedRevisions: REVISIONS_OPTS[1],
                    ghostingTimelock: "7 Days",
                    hostageTimelock: "14 Days"
                  });
                  setIsEditingJob(null);
                  setCounterMode(null);
                  setActiveTab("create");
                }} className="bg-blue-600 hover:bg-blue-500 text-white"><PlusCircle className="w-4 h-4 mr-2" /> Post New Job</Button>
              </div>
            )}
            
            {/* View: Client Admin Dashboard */}
            {activeTab === "dashboard" && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {/* Stat Card 1 */}
                  <div className="bg-zinc-900/50 border border-white/5 p-6 rounded-2xl flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                      <h4 className="text-zinc-400 text-sm font-medium">Total Jobs Posted</h4>
                      <Briefcase className="w-5 h-5 text-blue-500" />
                    </div>
                    <div className="mt-4">
                      <span className="text-3xl font-bold text-white">{jobs.length}</span>
                      <p className="text-xs text-green-400 mt-1 flex items-center gap-1"><TrendingUp className="w-3 h-3"/> +1 this week</p>
                    </div>
                  </div>
                  {/* Stat Card 2 */}
                  <div className="bg-zinc-900/50 border border-white/5 p-6 rounded-2xl flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                      <h4 className="text-zinc-400 text-sm font-medium">Pending Proposals</h4>
                      <FileCode2 className="w-5 h-5 text-amber-500" />
                    </div>
                    <div className="mt-4">
                      <span className="text-3xl font-bold text-white">{submittedProposals.filter(p => p.status.startsWith("PENDING")).length}</span>
                      <p className="text-xs text-zinc-500 mt-1 flex items-center gap-1"><Clock className="w-3 h-3"/> Awaiting your review</p>
                    </div>
                  </div>
                  {/* Stat Card 3 */}
                  <div className="bg-zinc-900/50 border border-white/5 p-6 rounded-2xl flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                      <h4 className="text-zinc-400 text-sm font-medium">Active Escrows</h4>
                      <Lock className="w-5 h-5 text-green-500" />
                    </div>
                    <div className="mt-4">
                      <span className="text-3xl font-bold text-white">{submittedProposals.filter(p => ["ACCEPTED", "DELIVERED"].includes(p.status)).length}</span>
                      <p className="text-xs text-green-400 mt-1 flex items-center gap-1"><CheckCircle className="w-3 h-3"/> Fully funded</p>
                    </div>
                  </div>
                  {/* Stat Card 4 */}
                  <div className="bg-gradient-to-br from-blue-900/20 to-emerald-900/20 border border-blue-500/20 p-6 rounded-2xl flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                      <h4 className="text-zinc-400 text-sm font-medium">Total Spent (USDC)</h4>
                      <DollarSign className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div className="mt-4">
                      <span className="text-3xl font-bold text-white font-mono">0.00</span>
                      <p className="text-xs text-blue-400 mt-1 flex items-center gap-1">Stellar Testnet</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
                  <div className="bg-zinc-900/30 border border-white/5 p-6 rounded-2xl">
                    <h3 className="text-lg font-bold text-white mb-4">Recent Activity</h3>
                    {jobs.length > 0 ? (
                      <div className="space-y-4">
                        <div className="flex items-center gap-4 text-sm">
                          <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400"><PlusCircle className="w-4 h-4"/></div>
                          <div>
                            <p className="text-white">You posted a new job</p>
                            <p className="text-zinc-500 text-xs">{jobs[0].title}</p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p className="text-zinc-500 text-sm">No recent activity.</p>
                    )}
                  </div>
                  <div className="bg-zinc-900/30 border border-white/5 p-6 rounded-2xl">
                    <h3 className="text-lg font-bold text-white mb-4">Recommended Freelancers</h3>
                    <div className="space-y-4">
                      {freelancers.slice(0, 3).map(fl => (
                        <div 
                          key={fl.id} 
                          className="flex items-center justify-between cursor-pointer hover:bg-white/5 p-2 rounded-lg transition-colors"
                          onClick={() => router.push(`/profile/${fl.walletAddress}`)}
                        >
                          <div className="flex items-center gap-3">
                            <UserCircle className="w-8 h-8 text-blue-400" />
                            <div>
                              <p className="text-white text-sm font-bold truncate max-w-[120px]" title={fl.name}>{fl.name}</p>
                              <p className="text-zinc-500 text-xs truncate max-w-[120px]" title={fl.title}>{fl.title}</p>
                            </div>
                          </div>
                          <span className="text-yellow-500 text-xs">★ {fl.rating}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* View: Create / Edit Job Form */}
            {activeTab === "create" && (
              <motion.form onSubmit={handlePostJob} initial={{opacity: 0}} animate={{opacity:1}} className="bg-zinc-900/40 p-6 rounded-2xl border border-white/5 space-y-8">
                <div className="border-b border-white/5 pb-4 flex justify-between items-center">
                  <div>
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">{isEditingJob ? "Edit Job Post" : "Post Job Requirements"}</h3>
                    <p className="text-sm text-zinc-400 mt-1">Set the rules, budget, and penalties. Freelancers will bid on these terms.</p>
                  </div>
                  {isEditingJob && <div className="text-blue-500 bg-blue-500/10 px-3 py-1 rounded text-xs font-bold animate-pulse">EDIT MODE</div>}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-zinc-400">Project Title</Label>
                    <Input required placeholder="e.g. Next.js Frontend Developer" value={newJob.title || ""} onChange={e => setNewJob({...newJob, title: e.target.value})} className="bg-black/50 border-white/10 text-white focus-visible:ring-blue-500" />
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-zinc-400">Budget Range</Label>
                    <div className="flex gap-2">
                      <Input required placeholder="e.g. 5000 - 8000" value={newJob.budgetRange || ""} onChange={e => setNewJob({...newJob, budgetRange: e.target.value})} className="bg-black/50 border-white/10 text-white focus-visible:ring-blue-500" />
                      <select required className={`w-32 flex h-10 rounded-md border border-input bg-black/50 px-3 py-2 text-sm text-white border-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500`}
                        value={newJob.paymentAsset || PAYMENT_ASSETS[0]}
                        onChange={e => setNewJob({...newJob, paymentAsset: e.target.value})}
                      >
                        {PAYMENT_ASSETS.map(a => <option key={a} value={a} className="bg-zinc-900 text-white">{a}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label className="text-zinc-400">Scope & Deliverables</Label>
                    <Textarea required placeholder="Describe the work required..." value={newJob.scope || ""} onChange={e => setNewJob({...newJob, scope: e.target.value})} className="bg-black/50 border-white/10 text-white focus-visible:ring-blue-500 min-h-[100px]" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-zinc-400">Job Category</Label>
                    <select required className="w-full flex h-10 rounded-md border border-input bg-black/50 px-3 py-2 text-sm text-white border-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                      value={newJob.category || JOB_CATEGORIES[0]}
                      onChange={e => setNewJob({...newJob, category: e.target.value})}
                    >
                      {JOB_CATEGORIES.map(c => <option key={c} value={c} className="bg-zinc-900 text-white">{c}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-zinc-400">Required Expertise</Label>
                    <Input required placeholder="e.g. React, Rust, Figma" value={newJob.expertise || ""} onChange={e => setNewJob({...newJob, expertise: e.target.value})} className="bg-black/50 border-white/10 text-white focus-visible:ring-blue-500" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-zinc-400">Proposed Timeline</Label>
                    <div className="flex gap-2">
                      <Input required type="number" placeholder="e.g. 1" value={newJob.timelineAmount || ""} onChange={e => setNewJob({...newJob, timelineAmount: e.target.value})} className="bg-black/50 border-white/10 text-white focus-visible:ring-blue-500" />
                      <select required className={`${selectStyle} w-32 focus-visible:ring-blue-500`}
                        value={newJob.timelineUnit}
                        onChange={e => setNewJob({...newJob, timelineUnit: e.target.value})}
                      >
                        {DELIVERY_UNITS.map(u => <option key={u} value={u} className="bg-zinc-900 text-white">{u}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-zinc-400">Expected Revisions</Label>
                    <select required className={`${selectStyle} focus-visible:ring-blue-500`}
                        value={newJob.expectedRevisions || REVISIONS_OPTS[1]}
                        onChange={e => setNewJob({...newJob, expectedRevisions: e.target.value})}
                      >
                        {REVISIONS_OPTS.map(r => <option key={r} value={r} className="bg-zinc-900 text-white">{r}</option>)}
                    </select>
                  </div>

                  {/* Escrow Enum */}
                  <div className="space-y-2">
                    <Label className="text-zinc-400">Escrow Preference</Label>
                    <select required className={`${selectStyle} focus-visible:ring-blue-500`}
                      value={newJob.escrowType}
                      onChange={e => setNewJob({...newJob, escrowType: e.target.value})}
                    >
                      {ESCROW_PREFS.map(e => <option key={e.value} value={e.value} className="bg-zinc-900 text-white">{e.value}</option>)}
                    </select>
                    <p className="text-xs text-blue-400/80 mt-1 flex items-start gap-1">
                      <Info className="w-3 h-3 mt-0.5 shrink-0"/> 
                      {ESCROW_PREFS.find(e => e.value === newJob.escrowType)?.text}
                    </p>
                  </div>

                  {/* Penalty Enum */}
                  <div className="space-y-2">
                    <Label className="text-zinc-400">Late Penalty Structure</Label>
                    <select required className={`${selectStyle} focus-visible:ring-blue-500`}
                      value={newJob.penaltyPref}
                      onChange={e => setNewJob({...newJob, penaltyPref: e.target.value})}
                    >
                      {LATE_PENALTIES.map(p => <option key={p.value} value={p.value} className="bg-zinc-900 text-white">{p.value}</option>)}
                    </select>
                    <p className="text-xs text-blue-400/80 mt-1 flex items-start gap-1">
                      <Info className="w-3 h-3 mt-0.5 shrink-0"/> 
                      {LATE_PENALTIES.find(p => p.value === newJob.penaltyPref)?.text}
                    </p>
                  </div>

                  {/* Dispute Enum */}
                  <div className="space-y-2 md:col-span-2">
                    <Label className="text-zinc-400">Dispute Resolution Preference</Label>
                    <select required className={`${selectStyle} focus-visible:ring-blue-500`}
                      value={newJob.disputePref}
                      onChange={e => setNewJob({...newJob, disputePref: e.target.value})}
                    >
                      {DISPUTE_ORACLES.map(d => <option key={d.value} value={d.value} className="bg-zinc-900 text-white">{d.value}</option>)}
                    </select>
                    <p className="text-xs text-blue-400/80 mt-1 flex items-start gap-1">
                      <Info className="w-3 h-3 mt-0.5 shrink-0"/> 
                      {DISPUTE_ORACLES.find(d => d.value === newJob.disputePref)?.text}
                    </p>
                  </div>

                </div>

                <div className="flex justify-end pt-4 border-t border-white/5">
                  {isEditingJob && <Button type="button" variant="ghost" onClick={() => {setIsEditingJob(null); setActiveTab("active");}} className="mr-4 text-zinc-400 hover:text-white">Cancel</Button>}
                  <Button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white px-8"><Send className="w-4 h-4 mr-2" /> {isEditingJob ? "Save Updates" : "Post to Job Board"}</Button>
                </div>
              </motion.form>
            )}

            {/* View: My Posted Jobs */}
            {activeTab === "active" && (
              <div className="space-y-6">
                <h3 className="text-lg font-bold text-white">Your Open Job Listings</h3>
                {jobs.map((job) => (
                  <div key={job.id} className="bg-zinc-900/30 border border-white/5 p-5 rounded-xl flex justify-between items-start group">
                    <div>
                      <h4 className="text-white font-bold text-lg truncate" title={job.title}>{job.title}</h4>
                      <div className="flex gap-4 mt-2">
                        <span className="text-xs text-blue-400 bg-blue-500/10 px-2 py-1 rounded border border-blue-500/20">{job.budgetRange} {(job.paymentAsset || "USDC").split(" ")[0]}</span>
                        <span className="text-xs text-zinc-400 border border-white/10 px-2 py-1 rounded">{job.escrowType}</span>
                      </div>
                    </div>
                    <Button variant="outline" onClick={() => handleEditJob(job)} className="border-blue-500/30 text-blue-400 hover:bg-blue-500/10 hover:text-blue-300 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Edit className="w-4 h-4 mr-2" /> Edit Job
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* View: Discover Talent (Direct Hire) */}
            {activeTab === "discover" && (
              <div className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    Top Freelancers on TrustFlow 
                    <span className="bg-blue-500/20 text-blue-400 text-xs px-2 py-1 rounded">Direct Hire</span>
                  </h3>
                  <div className="relative w-full md:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                    <Input 
                      placeholder="Search talents or skills..." 
                      value={talentSearch}
                      onChange={(e) => setTalentSearch(e.target.value)}
                      className="pl-9 bg-black/50 border-white/10 text-white focus:border-green-500 transition-colors"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {freelancers.filter(fl => 
                    fl.name.toLowerCase().includes(talentSearch.toLowerCase()) || 
                    fl.skills.some((s: string) => s.toLowerCase().includes(talentSearch.toLowerCase())) ||
                    fl.title.toLowerCase().includes(talentSearch.toLowerCase())
                  ).map(fl => (
                    <motion.div 
                      key={fl.id} 
                      whileHover={{ y: -5 }} 
                      onClick={() => router.push(`/profile/${fl.walletAddress}`)}
                      className="bg-zinc-900/50 border border-white/10 p-6 rounded-2xl flex flex-col justify-between group cursor-pointer hover:border-green-500/50 transition-colors"
                    >
                      <div>
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="text-xl font-bold text-white flex items-center gap-2 overflow-hidden"><UserCircle className="w-6 h-6 text-blue-400 shrink-0" /> <span className="truncate" title={fl.name}>{fl.name}</span></h4>
                          <span className="bg-zinc-800 text-yellow-500 text-xs font-bold px-2 py-1 rounded flex items-center gap-1">★ {fl.rating}</span>
                        </div>
                        <p className="text-sm text-zinc-400 mb-4 break-words line-clamp-3" title={fl.title}>{fl.title}</p>
                        <div className="flex flex-wrap gap-2 mb-6">
                          {fl.skills.map((s: string) => <span key={s} className="bg-white/5 border border-white/10 text-xs px-2 py-1 rounded text-zinc-300">{s}</span>)}
                        </div>
                      </div>
                      <div className="flex justify-between items-center border-t border-white/5 pt-4">
                        <div className="flex gap-4">
                          <span className="font-mono text-zinc-300 font-bold">{fl.rate}</span>
                          <span className="text-xs text-zinc-500 mt-1">{fl.completed} jobs done</span>
                        </div>
                        <Button variant="outline" onClick={(e) => {
                            e.stopPropagation();
                            setNewJob({ ...newJob, title: `Direct Hire: ${fl.name}`, scope: "Custom work specifically for this talent." });
                            setActiveTab("create");
                        }} className="border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300 transition-opacity">
                          Hire Directly
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* View: Incoming Proposals */}
            {activeTab === "proposals" && (
              <div className="space-y-10">
                {counterMode ? (
                  <motion.form onSubmit={handleSendCounter} initial={{opacity:0, scale: 0.95}} animate={{opacity:1, scale: 1}} className="bg-blue-950/20 p-6 rounded-2xl border border-blue-500/20 space-y-6">
                    <div>
                      <h3 className="text-xl font-bold text-blue-400">Counter Offer (Pazarlık Modu)</h3>
                      <p className="text-sm text-zinc-400">Adjust the terms. The contract will be sent back to the freelancer for final signature.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="space-y-2">
                        <Label className="text-zinc-400">Total Bid Amount</Label>
                        <Input required type="number" value={counterBidAmount} onChange={e => setCounterBidAmount(e.target.value)} className="bg-black/50 border-white/10 text-white focus-visible:ring-blue-500 text-lg font-mono" />
                      </div>
                      
                      <div className="space-y-2">
                        <Label className="text-zinc-400">Delivery Timeline</Label>
                        <div className="flex gap-2">
                          <Input required type="number" value={counterDeliveryAmount} onChange={e => setCounterDeliveryAmount(e.target.value)} className="bg-black/50 border-white/10 text-white focus-visible:ring-blue-500" />
                          <select required className={`${selectStyle} w-32 focus-visible:ring-blue-500`}
                            value={counterDeliveryUnit}
                            onChange={e => setCounterDeliveryUnit(e.target.value)}
                          >
                            {DELIVERY_UNITS.map(u => <option key={u} value={u} className="bg-zinc-900 text-white">{u}</option>)}
                          </select>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-zinc-400">Revisions Needed</Label>
                        <select required className={`${selectStyle} focus-visible:ring-blue-500`}
                            value={counterRevisions}
                            onChange={e => setCounterRevisions(e.target.value)}
                          >
                            {REVISIONS_OPTS.map(r => <option key={r} value={r} className="bg-zinc-900 text-white">{r}</option>)}
                        </select>
                      </div>
                    </div>
                    
                    <div className="flex justify-end gap-3 pt-4 border-t border-blue-500/10">
                      <Button type="button" variant="ghost" onClick={() => setCounterMode(null)} className="text-zinc-400 hover:text-white">Cancel</Button>
                      <Button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white"><Send className="w-4 h-4 mr-2" /> Send Counter Offer</Button>
                    </div>
                  </motion.form>
                ) : submittedProposals.filter(p => p.status.startsWith("PENDING")).length === 0 ? (
                  <div className="text-center py-20 bg-zinc-900/20 rounded-3xl border border-dashed border-white/10">
                     <FileCode2 className="w-10 h-10 text-zinc-600 mx-auto mb-4" />
                     <h3 className="text-xl font-bold text-zinc-400">No pending proposals</h3>
                     <p className="text-zinc-500 mt-2">When freelancers apply to your jobs, their Contracts will appear here.</p>
                  </div>
                ) : (
                  submittedProposals.filter(p => p.status.startsWith("PENDING")).map((prop, i) => (
                    <div key={i} className="space-y-4">
                      <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full animate-pulse ${prop.status === "PENDING_CLIENT" ? "bg-amber-500" : "bg-emerald-500"}`}></span> 
                        {prop.status === "PENDING_CLIENT" ? "Counter Offer from Freelancer" : "Submitted Proposal"} for Job: {prop.jobId}
                      </h3>
                      <ContractTemplate 
                          data={prop}
                          viewMode="client"
                          onAction={() => handleFundEscrow(prop)}
                          actionText="Accept Terms & Fund Escrow"
                          onDecline={() => toast.info("Proposal Declined")}
                          onCounterOffer={() => initCounterOffer(prop)}
                      />
                    </div>
                  ))
                )}
              </div>
            )}

            {/* View: Active Escrows (Workrooms) (Client) */}
            {activeTab === "workrooms" && (
              <div className="space-y-10">
                {submittedProposals.filter(p => ["ACCEPTED", "DELIVERED"].includes(p.status)).length === 0 ? (
                  <div className="text-center py-20 bg-zinc-900/20 rounded-3xl border border-dashed border-white/10">
                     <Briefcase className="w-10 h-10 text-zinc-600 mx-auto mb-4" />
                     <h3 className="text-xl font-bold text-zinc-400">No active escrows</h3>
                     <p className="text-zinc-500 mt-2">Fund a pending proposal to lock the escrow and start the contract.</p>
                  </div>
                ) : (
                  submittedProposals.filter(p => ["ACCEPTED", "DELIVERED"].includes(p.status)).map((prop, i) => (
                    <div key={i} className="space-y-4">
                      <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span> 
                        Contract Active for Job: {prop.jobId}
                      </h3>
                      <ContractTemplate 
                          data={prop}
                          viewMode="client"
                          onAction={() => { setSelectedWorkroom(prop); setActiveTab("workroom_detail"); }}
                          actionText="View Workroom"
                      />
                    </div>
                  ))
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {/* View: Workroom Detail (Shared between Client and FL) */}
        {activeTab === "workroom_detail" && selectedWorkroom && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
            <Button variant="ghost" onClick={() => { setActiveTab("workrooms"); setSelectedWorkroom(null); }} className="text-zinc-400 hover:text-white mb-2">← Back to Active Escrows</Button>
            
            <div className="bg-zinc-900/60 border border-white/10 p-4 sm:p-8 rounded-3xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-green-500"></div>
              <h2 className="text-3xl font-bold text-white mb-2">Secure Workroom</h2>
              <p className="text-zinc-400 mb-8">Job ID: {selectedWorkroom.jobId}</p>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Status Tracker */}
                <div className="space-y-6">
                  <h3 className="text-xl font-bold text-white">Escrow Status</h3>
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="w-8 h-8 rounded-full bg-green-500/20 text-green-500 flex items-center justify-center">✓</div>
                      <div>
                        <p className="text-white font-bold">Escrow Funded</p>
                        <p className="text-sm text-zinc-500">Funds locked in Soroban</p>
                      </div>
                    </div>
                    <div className="w-0.5 h-6 bg-white/10 ml-4"></div>
                    <div className="flex items-center gap-4">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${selectedWorkroom.status === "DELIVERED" || selectedWorkroom.status === "COMPLETED" ? "bg-green-500/20 text-green-500" : "bg-blue-500/20 text-blue-500"}`}>
                        {selectedWorkroom.status === "DELIVERED" || selectedWorkroom.status === "COMPLETED" ? "✓" : "2"}
                      </div>
                      <div>
                        <p className="text-white font-bold">Work Delivered</p>
                        <p className="text-sm text-zinc-500">Awaiting Client Approval</p>
                      </div>
                    </div>
                    <div className="w-0.5 h-6 bg-white/10 ml-4"></div>
                    <div className="flex items-center gap-4">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${selectedWorkroom.status === "COMPLETED" ? "bg-green-500/20 text-green-500" : "bg-zinc-800 text-zinc-500"}`}>
                        {selectedWorkroom.status === "COMPLETED" ? "✓" : "3"}
                      </div>
                      <div>
                        <p className="text-white font-bold">Funds Released</p>
                        <p className="text-sm text-zinc-500">Payout executed</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col justify-center space-y-6">

                  {/* Milestones & Commits (Timeline) */}
                  <div className="bg-black/50 rounded-2xl p-3 sm:p-6 border border-white/5">
                    <h3 className="text-xl font-bold text-white mb-6">Milestones & Commits</h3>
                    <div className="space-y-8">
                      {selectedWorkroom.milestones.map((m, i) => {
                        const isPreviousApproved = i === 0 || selectedWorkroom.milestones[i - 1].status === "APPROVED";
                        const isActive = isPreviousApproved && m.status !== "APPROVED";
                        const mStatus = m.status || "PENDING";
                        
                        return (
                        <div key={i} className={`relative pl-6 border-l-2 ${isActive ? 'border-blue-500' : 'border-white/10'} pb-4 transition-all ${!isPreviousApproved && 'opacity-50 grayscale'}`}>
                          <div className={`absolute -left-[9px] top-0 w-4 h-4 rounded-full border-4 border-black ${mStatus === 'APPROVED' ? 'bg-green-500' : isActive ? 'bg-blue-500' : 'bg-zinc-700'}`}></div>
                          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-2 gap-2">
                            <div>
                              <h4 className="text-white font-bold text-lg">{m.name}</h4>
                              <p className="text-sm text-zinc-500">{m.percentage}% of total funds ({m.amount} {String(selectedWorkroom.paymentAsset).includes("undefined") ? "USDC" : (selectedWorkroom.paymentAsset || "").split(" ")[1] || "USDC"})</p>
                            </div>
                            <div className="text-right shrink-0">
                              <span className={`text-xs font-bold px-2 py-1 rounded-full ${mStatus === 'APPROVED' ? 'bg-green-500/20 text-green-400' : mStatus === 'SUBMITTED' ? 'bg-amber-500/20 text-amber-400' : mStatus === 'REVISION_REQUESTED' ? 'bg-red-500/20 text-red-400' : 'bg-zinc-800 text-zinc-400'}`}>
                                {mStatus}
                              </span>
                            </div>
                          </div>

                          {/* Commits List */}
                          <div className="mt-4 space-y-3">
                            {m.commits && m.commits.length > 0 ? (
                              m.commits.map((commit, cIdx) => (
                                <div key={cIdx} className="bg-white/5 border border-white/10 rounded-xl p-3 flex gap-3">
                                  <div className="mt-1">
                                    <GitCommit className="w-4 h-4 text-zinc-500" />
                                  </div>
                                  <div>
                                    <p className="text-white text-sm whitespace-pre-wrap break-all">{commit.message}</p>
                                    <p className="text-xs text-zinc-500 mt-1">{commit.date}</p>
                                  </div>
                                </div>
                              ))
                            ) : (
                              <p className="text-sm text-zinc-600 italic">No commits yet for this milestone.</p>
                            )}
                          </div>

                          {/* Action Area */}
                          {isActive && (
                            <div className="mt-6 pt-4 border-t border-white/10 flex flex-col gap-3">
                              {/* Freelancer Actions */}
                              {role === "freelancer" && (mStatus === "PENDING" || mStatus === "REVISION_REQUESTED") && (
                                <div className="space-y-3">
                                  <div className="flex flex-col gap-3">
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      onClick={() => setSelectedMilestoneId(selectedMilestoneId === m.id ? null : m.id)}
                                      className="border-blue-500/50 text-blue-400 hover:bg-blue-500/10 w-full"
                                    >
                                      + Add Commit / Log
                                    </Button>
                                    <Button 
                                      onClick={() => handleSubmitMilestone(m.id, i)}
                                      disabled={isTxPending || (!m.commits || m.commits.length === 0)}
                                      className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold"
                                    >
                                      {isTxPending ? "Submitting..." : "Submit Milestone"}
                                    </Button>
                                  </div>
                                  {(!m.commits || m.commits.length === 0) && <p className="text-xs text-amber-500/70 text-center">Please add at least one commit/log before submitting.</p>}
                                </div>
                              )}

                              {/* Add Commit Form */}
                              {selectedMilestoneId === m.id && role === "freelancer" && (
                                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mt-2 bg-zinc-900/80 border border-blue-500/30 p-4 rounded-xl space-y-3">
                                  <Textarea 
                                    placeholder="Describe what you completed in this commit..."
                                    value={commitMessage}
                                    onChange={(e) => setCommitMessage(e.target.value)}
                                    className="bg-black/50 border-white/10 text-white text-sm min-h-[80px]"
                                  />
                                  <div className="flex justify-end gap-2">
                                    <Button variant="ghost" size="sm" onClick={() => setSelectedMilestoneId(null)} className="text-zinc-400">Cancel</Button>
                                    <Button size="sm" className="bg-blue-600 hover:bg-blue-500 text-white" onClick={() => {
                                      if(!commitMessage.trim()) return;
                                      
                                      const updatedProposals = submittedProposals.map(p => {
                                        if(p.jobId === selectedWorkroom.jobId && p.freelancerAddress === selectedWorkroom.freelancerAddress) {
                                          const updatedMilestones = p.milestones.map(mile => {
                                            if(mile.id === m.id) {
                                              return {
                                                ...mile,
                                                commits: [...(mile.commits || []), { message: commitMessage, date: new Date().toLocaleString() }]
                                              };
                                            }
                                            return mile;
                                          });
                                          return { ...p, milestones: updatedMilestones };
                                        }
                                        return p;
                                      });
                                      
                                      setSubmittedProposals(updatedProposals);
                                      setSelectedWorkroom(updatedProposals.find(p => p.jobId === selectedWorkroom.jobId && p.freelancerAddress === selectedWorkroom.freelancerAddress) || selectedWorkroom);
                                      setCommitMessage("");
                                      setSelectedMilestoneId(null);
                                      toast.success("Commit added successfully!");
                                    }}>
                                      Push Commit
                                    </Button>
                                  </div>
                                </motion.div>
                              )}

                              {/* Dynamic AI Review Results */}
                              {mStatus === "SUBMITTED" && (() => {
                                const cacheKey = `${selectedWorkroom.jobId}-${m.id}`;
                                const isLoading = loadingAiReview[cacheKey];
                                const review = aiReviews[cacheKey];

                                return (
                                  <div className="space-y-4 mt-4">
                                    {isLoading ? (
                                      <div className="bg-indigo-950/10 border border-indigo-500/20 p-5 rounded-2xl animate-pulse space-y-3">
                                        <div className="flex items-center gap-2">
                                          <Brain className="w-5 h-5 text-indigo-400 animate-bounce" />
                                          <h4 className="text-indigo-400 font-bold text-sm">TrustFlow AI is analyzing this delivery...</h4>
                                        </div>
                                        <div className="h-2 bg-indigo-500/10 rounded w-3/4"></div>
                                        <div className="h-2 bg-indigo-500/10 rounded w-1/2"></div>
                                      </div>
                                    ) : review ? (
                                      <motion.div 
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="bg-zinc-900/60 border border-indigo-500/30 p-3 sm:p-5 rounded-2xl shadow-[0_0_20px_rgba(99,102,241,0.1)] space-y-4"
                                      >
                                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center pb-3 border-b border-white/5 gap-2">
                                          <div className="flex items-center gap-2">
                                            <Brain className="w-5 h-5 text-indigo-400 shrink-0" />
                                            <h4 className="text-white font-bold text-sm">TrustFlow AI Audit</h4>
                                          </div>
                                          <div className="flex flex-wrap items-center gap-2">
                                            <span className="text-[10px] text-zinc-500 font-mono">Conf: {review.aiConfidence}%</span>
                                            <div className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                                              review.score >= 80 ? "bg-green-500/10 text-green-400 border border-green-500/20" :
                                              review.score >= 60 ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" :
                                              "bg-red-500/10 text-red-400 border border-red-500/20"
                                            }`}>
                                              Score: {review.score}/100
                                            </div>
                                          </div>
                                        </div>

                                        <div className="space-y-2">
                                          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                                            <span className="text-xs text-zinc-500 uppercase tracking-wider font-bold">Recommendation:</span>
                                            <span className={`text-[10px] sm:text-xs font-black px-2 py-0.5 rounded-full ${
                                              review.recommendation === "APPROVE" ? "bg-green-500/20 text-green-400 border border-green-500/30" :
                                              review.recommendation === "REVISION_NEEDED" ? "bg-amber-500/20 text-amber-400 border border-amber-500/30" :
                                              "bg-red-500/20 text-red-400 border border-red-500/30"
                                            }`}>
                                              {review.recommendation}
                                            </span>
                                          </div>
                                          <p className="text-xs text-zinc-300 leading-relaxed bg-black/30 p-2 sm:p-3 rounded-xl border border-white/5 break-words">
                                            {review.summary}
                                          </p>
                                        </div>

                                        {/* Strengths & Concerns */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px] pt-1">
                                          {review.strengths && review.strengths.length > 0 && (
                                            <div className="space-y-1.5 bg-green-500/5 p-2 sm:p-3 rounded-xl border border-green-500/10">
                                              <span className="font-bold text-green-400 flex items-center gap-1">
                                                <CheckCircle2 className="w-3.5 h-3.5" /> Strengths
                                              </span>
                                              <ul className="space-y-1 text-zinc-400 list-disc list-inside">
                                                {review.strengths.slice(0, 3).map((s: string, sIdx: number) => (
                                                  <li key={sIdx} className="line-clamp-2">{s}</li>
                                                ))}
                                              </ul>
                                            </div>
                                          )}
                                          
                                          {review.concerns && review.concerns.length > 0 && (
                                            <div className="space-y-1.5 bg-red-500/5 p-2 sm:p-3 rounded-xl border border-red-500/10">
                                              <span className="font-bold text-red-400 flex items-center gap-1">
                                                <AlertTriangle className="w-3.5 h-3.5" /> Concerns
                                              </span>
                                              <ul className="space-y-1 text-zinc-400 list-disc list-inside">
                                                {review.concerns.slice(0, 3).map((c: string, cIdx: number) => (
                                                  <li key={cIdx} className="line-clamp-2">{c}</li>
                                                ))}
                                              </ul>
                                            </div>
                                          )}
                                        </div>

                                        {/* Revision Suggestions */}
                                        {review.recommendation !== "APPROVE" && review.revisionSuggestions && review.revisionSuggestions.length > 0 && (
                                          <div className="bg-amber-500/5 p-2 sm:p-3 rounded-xl border border-amber-500/10 space-y-1.5 text-[11px]">
                                            <span className="font-bold text-amber-400 flex items-center gap-1">
                                              <Wrench className="w-3.5 h-3.5" /> Actionable Revision Suggestions
                                            </span>
                                            <ul className="space-y-1 text-zinc-400 list-disc list-inside">
                                              {review.revisionSuggestions.slice(0, 3).map((s: string, sIdx: number) => (
                                                <li key={sIdx} className="line-clamp-2">{s}</li>
                                              ))}
                                            </ul>
                                          </div>
                                        )}
                                      </motion.div>
                                    ) : (
                                      <div className="bg-zinc-900/40 border border-white/5 p-4 rounded-xl flex items-center justify-between">
                                        <span className="text-xs text-zinc-400">AI review was not generated or failed to load.</span>
                                        <Button 
                                          variant="ghost" 
                                          size="sm" 
                                          onClick={() => {
                                            const jobDetail = jobs.find(j => j.id === selectedWorkroom.jobId) || {
                                              title: "Freelance Project",
                                              scope: selectedWorkroom.acceptanceCriteria || "No project scope details provided."
                                            };
                                            const deliveryNotes = m.commits?.map(c => c.message).join("\n\n") || "No delivery logs provided.";
                                            setLoadingAiReview(prev => ({ ...prev, [cacheKey]: true }));
                                            
                                            fetch("/api/ai-review", {
                                              method: "POST",
                                              headers: { "Content-Type": "application/json" },
                                              body: JSON.stringify({
                                                jobTitle: jobDetail.title,
                                                jobDescription: jobDetail.scope,
                                                milestoneDescription: m.name,
                                                deliveryNotes: deliveryNotes
                                              })
                                            })
                                            .then(r => r.json())
                                              .then(data => {
                                                if (data.success && data.review) {
                                                  setAiReviews(prev => ({ ...prev, [cacheKey]: data.review }));
                                                }
                                              })
                                              .catch(e => console.error("Error fetching AI review:", e))
                                              .finally(() => {
                                                setLoadingAiReview(prev => ({ ...prev, [cacheKey]: false }));
                                              });
                                          }}
                                          className="text-xs text-indigo-400 hover:text-indigo-300"
                                        >
                                          <Sparkles className="w-3.5 h-3.5 mr-1" /> Retry AI Audit
                                        </Button>
                                      </div>
                                    )}

                                    {/* Client Action Buttons */}
                                    {role === "client" && (
                                      <div className="flex flex-col gap-3">
                                        <Button 
                                          onClick={() => handleRequestRevision(m.id, i)}
                                          disabled={isTxPending}
                                          variant="outline"
                                          className="w-full border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300 hover:border-red-500 transition-all font-bold"
                                        >
                                          {isTxPending ? "Processing..." : "Request Revision"}
                                        </Button>
                                        <Button 
                                          onClick={() => handleApproveMilestone(m.id, i)}
                                          disabled={isTxPending}
                                          className="w-full bg-green-500 hover:bg-green-600 text-black font-bold shadow-[0_0_15px_rgba(34,197,94,0.3)] disabled:opacity-50"
                                        >
                                          {isTxPending ? "Processing..." : "Approve & Release"}
                                        </Button>
                                      </div>
                                    )}
                                  </div>
                                );
                              })()}
                            </div>
                          )}
                        </div>
                        );
                      })}
                    </div>
                  </div>

                  {selectedWorkroom.status === "COMPLETED" && (
                    <div className="space-y-4 pt-4 border-t border-white/5">
                      {role === "client" ? (
                        hasSubmittedReview ? (
                          <div className="text-center py-6 text-green-400 font-bold bg-green-500/10 rounded-2xl border border-green-500/20 space-y-1">
                            <p className="text-base">Escrow Completed Successfully! 🎉</p>
                            <p className="text-xs text-zinc-400 font-normal">Thank you for rating your freelancer. Your review is now public.</p>
                          </div>
                        ) : (
                          <motion.form 
                            onSubmit={handleSendReview} 
                            className="bg-zinc-950/60 border border-green-500/20 p-5 rounded-2xl space-y-4 shadow-[0_0_15px_rgba(34,197,94,0.05)]"
                          >
                            <h4 className="text-white font-bold text-sm flex items-center gap-2">
                              <Sparkles className="w-4 h-4 text-yellow-500" /> Rate the Freelancer
                            </h4>
                            <div className="flex gap-2 justify-center py-1">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                  type="button"
                                  key={star}
                                  onClick={() => setReviewRating(star)}
                                  className="text-2xl transition-transform hover:scale-110 active:scale-95 focus:outline-none"
                                >
                                  {star <= reviewRating ? "★" : "☆"}
                                </button>
                              ))}
                            </div>
                            <Textarea
                              placeholder="Write a review about the freelancer's communication, speed, and code quality..."
                              value={reviewComment}
                              onChange={(e) => setReviewComment(e.target.value)}
                              className="bg-black/50 border-white/10 text-white text-xs min-h-[70px]"
                              required
                            />
                            <Button 
                              type="submit" 
                              disabled={isReviewSubmitting || !reviewComment.trim()} 
                              className="w-full bg-green-500 hover:bg-green-600 text-black font-bold text-xs py-2.5 rounded-xl shadow-[0_0_15px_rgba(34,197,94,0.2)]"
                            >
                              {isReviewSubmitting ? "Submitting..." : "Submit Review"}
                            </Button>
                          </motion.form>
                        )
                      ) : (
                        <div className="text-center py-6 text-green-400 font-bold bg-green-500/10 rounded-2xl border border-green-500/20">
                          Escrow Completed Successfully! Awaiting client feedback. 🎉
                        </div>
                      )}
                    </div>
                  )}

                  {selectedWorkroom.status !== "COMPLETED" && (
                    <div className="pt-2">
                      <Button 
                        onClick={() => handleDispute(selectedWorkroom.milestones[0].id, 0)}
                        disabled={isTxPending || selectedWorkroom.status === "DISPUTED"}
                        variant="ghost" 
                        className="w-full text-red-400 hover:text-red-300 hover:bg-red-500/10"
                      >
                        {selectedWorkroom.status === "DISPUTED" ? "Dispute Active" : "Open Dispute"}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showConfirmModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-6 max-w-md w-full shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-500/0 via-green-500 to-green-500/0 opacity-50"></div>
              <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                <span className="text-green-500">🛡️</span> Teklifi Onaylıyor musunuz?
              </h3>
              <p className="text-sm text-zinc-400 mb-6 leading-relaxed">
                Bütçe ve süreleri onaylıyorsanız teklifiniz doğrudan akıllı sözleşme standartlarına çevrilecektir. Bu teklif müşteri tarafından kabul edildiğinde fonlar Soroban ağına kilitlenecektir.
              </p>
              <div className="flex gap-3 justify-end mt-8">
                <Button variant="ghost" onClick={() => setShowConfirmModal(false)} className="text-zinc-400 hover:text-white hover:bg-white/5">İptal</Button>
                <Button onClick={executeSendProposal} className="bg-green-500 hover:bg-green-600 text-black font-bold shadow-[0_0_15px_rgba(34,197,94,0.4)]">Onayla ve Gönder</Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
