"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useWallet } from "@/components/WalletProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, User, Briefcase, Mail, Phone, MapPin, Globe, Code, Calendar, Edit2, Check, X, Sparkles } from "lucide-react";

export default function ProfilePage() {
  const { address, userProfile, disconnect, fetchUserProfile } = useWallet();
  const router = useRouter();

  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reviews, setReviews] = useState<any[]>([]);
  const [averageRating, setAverageRating] = useState<number>(0);
  const [totalReviews, setTotalReviews] = useState<number>(0);
  const [isLoadingReviews, setIsLoadingReviews] = useState(true);

  // Client Jobs State
  const [activeJobs, setActiveJobs] = useState<any[]>([]);
  const [pastJobs, setPastJobs] = useState<any[]>([]);
  const [isLoadingJobs, setIsLoadingJobs] = useState(true);

  // Form State
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    location: "",
    bio: "",
    skills: "",
    website: "",
    role: "freelancer",
  });

  useEffect(() => {
    if (!address) {
      router.push("/");
    } else if (userProfile) {
      if (userProfile.role === 'client') {
        // Fetch jobs for client
        fetch(`/api/users/${address}/jobs`)
          .then(res => res.json())
          .then(data => {
            if (data.activeJobs) setActiveJobs(data.activeJobs);
            if (data.pastJobs) setPastJobs(data.pastJobs);
            setIsLoadingJobs(false);
          })
          .catch(err => {
            console.error("Failed to load jobs", err);
            setIsLoadingJobs(false);
          });
      } else {
        // Fetch reviews for freelancer
        fetch(`/api/users/${address}/reviews`)
          .then(res => res.json())
          .then(data => {
            if (data.reviews) {
              setReviews(data.reviews);
              setAverageRating(data.averageRating);
              setTotalReviews(data.totalReviews);
            }
            setIsLoadingReviews(false);
          })
          .catch(err => {
            console.error("Failed to load reviews", err);
            setIsLoadingReviews(false);
          });
      }
    }
  }, [address, router, userProfile]);

  useEffect(() => {
    if (userProfile && !isEditing) {
      setFormData({
        firstName: userProfile.firstName || "",
        lastName: userProfile.lastName || "",
        email: userProfile.email || "",
        phone: userProfile.phone || "",
        location: userProfile.location || "",
        bio: userProfile.bio || "",
        skills: userProfile.skills || "",
        website: userProfile.website || "",
        role: userProfile.role || "freelancer",
      });
    }
  }, [userProfile, isEditing]);

  const handleSave = async () => {
    if (!formData.firstName.trim() || !formData.lastName.trim() || !formData.email.trim()) {
      toast.error("First Name, Last Name, and Email are required.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/users/${address}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error("Failed to update profile");
      
      toast.success("Profile updated successfully!");
      if (address) {
        await fetchUserProfile(address);
      }
      setIsEditing(false);
    } catch (e: any) {
      toast.error(e.message || "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!userProfile) return <div className="min-h-screen bg-black flex items-center justify-center text-white"><div className="w-8 h-8 border-4 border-white/20 border-t-white rounded-full animate-spin"></div></div>;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const seedData = async () => {
    try {
      toast.loading("Generating sample reviews...");
      const res = await fetch('/api/seed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress: address })
      });
      if (res.ok) {
        toast.dismiss();
        toast.success("Sample data created! Reloading...");
        setTimeout(() => window.location.reload(), 1000);
      } else {
        toast.dismiss();
        toast.error("Failed to seed data");
      }
    } catch (e) {
      toast.dismiss();
      toast.error("Error seeding data");
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      {/* Background Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-blue-500/10 blur-[120px] rounded-full pointer-events-none"></div>

      <div className="max-w-6xl mx-auto p-8 md:p-12 relative z-10">
        
        {/* Navigation */}
        <div className="flex items-center justify-between mb-8">
          <Button 
            variant="ghost" 
            onClick={() => router.push(`/${userProfile.role}`)}
            className="text-zinc-400 hover:text-white hover:bg-zinc-900 rounded-xl"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          
          {!isEditing ? (
            <Button onClick={() => setIsEditing(true)} className="bg-white text-black hover:bg-zinc-200 rounded-xl font-bold px-6 shadow-[0_0_20px_rgba(255,255,255,0.1)]">
              <Edit2 className="w-4 h-4 mr-2" />
              Edit Profile
            </Button>
          ) : (
            <div className="flex gap-3">
              <Button variant="ghost" onClick={() => setIsEditing(false)} className="text-zinc-400 hover:text-white hover:bg-zinc-900 rounded-xl" disabled={isSubmitting}>
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isSubmitting} className="bg-green-500 text-black hover:bg-green-400 rounded-xl font-bold px-6 shadow-[0_0_20px_rgba(34,197,94,0.2)]">
                {isSubmitting ? <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin mr-2"></div> : <Check className="w-4 h-4 mr-2" />}
                Save Changes
              </Button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Sidebar - Profile Card */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-zinc-900/40 border border-white/5 rounded-3xl overflow-hidden backdrop-blur-xl relative shadow-2xl">
              <div className="h-32 bg-gradient-to-br from-blue-600/30 via-purple-500/20 to-green-500/20 relative"></div>
              
              <div className="px-8 pb-8 relative">
                <div className="absolute -top-12 left-8 w-24 h-24 rounded-2xl bg-zinc-800 border-4 border-zinc-900 flex items-center justify-center text-4xl font-bold text-white shadow-xl overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
                  {formData.firstName.charAt(0)}{formData.lastName.charAt(0)}
                </div>
                
                <div className="pt-16 pb-6 border-b border-white/5">
                  <h1 className="text-2xl font-bold mb-1 tracking-tight">{userProfile.firstName} {userProfile.lastName}</h1>
                  <p className="text-zinc-500 font-mono text-xs mb-4 break-all">
                    {userProfile.walletAddress}
                  </p>
                  <span className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider ${
                    userProfile.role === 'client' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'bg-green-500/10 text-green-400 border border-green-500/20'
                  }`}>
                    {userProfile.role === 'client' ? <Briefcase className="w-3 h-3 mr-1.5" /> : <Code className="w-3 h-3 mr-1.5" />}
                    {userProfile.role}
                  </span>
                  
                  {/* Rating Badge (Only for Freelancers) */}
                  {userProfile.role === 'freelancer' && !isLoadingReviews && totalReviews > 0 && (
                    <div className="mt-3 flex items-center gap-2">
                      <div className="flex items-center text-yellow-400">
                        <span className="text-lg">⭐</span>
                        <span className="font-bold ml-1">{averageRating.toFixed(1)}</span>
                      </div>
                      <span className="text-zinc-500 text-sm">({totalReviews} Reviews)</span>
                    </div>
                  )}

                  {/* Jobs Badge (Only for Clients) */}
                  {userProfile.role === 'client' && !isLoadingJobs && (activeJobs.length > 0 || pastJobs.length > 0) && (
                    <div className="mt-3 flex items-center gap-2">
                      <span className="text-zinc-400 text-sm">{activeJobs.length} Active, {pastJobs.length} Past Jobs</span>
                    </div>
                  )}
                </div>
                
                <div className="pt-6 space-y-4">
                  <div className="flex items-center gap-3 text-sm text-zinc-400">
                    <Mail className="w-4 h-4 text-zinc-500" />
                    <span className="truncate">{userProfile.email}</span>
                  </div>
                  {userProfile.phone && (
                    <div className="flex items-center gap-3 text-sm text-zinc-400">
                      <Phone className="w-4 h-4 text-zinc-500" />
                      <span>{userProfile.phone}</span>
                    </div>
                  )}
                  {userProfile.location && (
                    <div className="flex items-center gap-3 text-sm text-zinc-400">
                      <MapPin className="w-4 h-4 text-zinc-500" />
                      <span>{userProfile.location}</span>
                    </div>
                  )}
                  {userProfile.website && (
                    <div className="flex items-center gap-3 text-sm text-blue-400">
                      <Globe className="w-4 h-4 text-blue-500" />
                      <a href={userProfile.website} target="_blank" rel="noopener noreferrer" className="hover:underline truncate">
                        {userProfile.website.replace(/^https?:\/\//, '')}
                      </a>
                    </div>
                  )}
                  <div className="flex items-center gap-3 text-sm text-zinc-500 pt-4 mt-4 border-t border-white/5">
                    <Calendar className="w-4 h-4" />
                    <span>Joined {new Date(userProfile.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <Button variant="outline" className="w-full border-red-500/20 text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded-xl h-12" onClick={() => {
              disconnect();
              router.push('/');
            }}>
              Log Out Securely
            </Button>
          </div>

          {/* Right Content Area */}
          <div className="lg:col-span-8">
            <div className="bg-zinc-900/40 border border-white/5 rounded-3xl p-8 md:p-10 backdrop-blur-xl shadow-2xl h-full">
              
              <AnimatePresence mode="wait">
                {!isEditing ? (
                  <motion.div 
                    key="view"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-10"
                  >
                    <div>
                      <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                        <User className="w-5 h-5 text-zinc-500" />
                        {userProfile.role === 'client' ? 'Company Bio' : 'Professional Bio'}
                      </h3>
                      <div className="bg-black/30 rounded-2xl p-6 border border-white/5">
                        <p className="text-zinc-300 leading-relaxed whitespace-pre-wrap break-words text-[15px]">
                          {userProfile.bio || <span className="text-zinc-600 italic">No bio provided yet. Add one to stand out!</span>}
                        </p>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-zinc-500" />
                        {userProfile.role === 'client' ? 'Industry & Focus' : 'Top Skills & Expertise'}
                      </h3>
                      <div className="bg-black/30 rounded-2xl p-6 border border-white/5">
                        {userProfile.skills ? (
                          <div className="flex flex-wrap gap-2">
                            {userProfile.skills.split(',').map((skill, i) => (
                              <span key={i} className="bg-white/10 border border-white/10 px-4 py-2 rounded-xl text-sm text-zinc-200 font-medium tracking-wide">
                                {skill.trim()}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <p className="text-zinc-600 italic">No skills listed yet.</p>
                        )}
                      </div>
                    </div>
                    {/* Conditional Bottom Section */}
                    {userProfile.role === 'client' ? (
                      <div className="pt-8 border-t border-white/5">
                        <div className="flex items-center justify-between mb-6">
                          <h3 className="text-xl font-bold text-white flex items-center gap-2">
                            <Briefcase className="w-5 h-5 text-blue-500" />
                            Company's Job Postings
                          </h3>
                        </div>

                        {isLoadingJobs ? (
                          <div className="animate-pulse flex space-x-4 p-6 bg-black/30 rounded-2xl border border-white/5">
                            <div className="flex-1 space-y-4 py-1">
                              <div className="h-2 bg-zinc-800 rounded w-3/4"></div>
                              <div className="space-y-3">
                                <div className="h-2 bg-zinc-800 rounded"></div>
                                <div className="h-2 bg-zinc-800 rounded w-5/6"></div>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-8">
                            {/* Active Jobs */}
                            <div>
                              <h4 className="text-sm font-bold text-green-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                                Active Jobs
                              </h4>
                              {activeJobs.length === 0 ? (
                                <p className="text-zinc-500 italic text-sm">No active job postings right now.</p>
                              ) : (
                                <div className="space-y-4">
                                  {activeJobs.map((job) => (
                                    <div key={job.id} className="bg-black/30 rounded-2xl p-6 border border-white/5 hover:border-white/10 transition-colors">
                                      <div className="flex justify-between items-start mb-2">
                                        <h4 className="font-bold text-white text-lg">{job.title}</h4>
                                        <span className="bg-blue-500/10 text-blue-400 px-3 py-1 rounded-lg text-xs font-bold border border-blue-500/20">${job.budget}</span>
                                      </div>
                                      <p className="text-sm text-zinc-400 mb-3">{job.industry}</p>
                                      <p className="text-zinc-300 text-sm leading-relaxed">{job.description}</p>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>

                            {/* Past Jobs */}
                            <div>
                              <h4 className="text-sm font-bold text-zinc-500 uppercase tracking-wider mb-4">Past History</h4>
                              {pastJobs.length === 0 ? (
                                <p className="text-zinc-600 italic text-sm">No completed jobs yet.</p>
                              ) : (
                                <div className="space-y-4">
                                  {pastJobs.map((job) => (
                                    <div key={job.id} className="bg-black/30 rounded-2xl p-6 border border-white/5 opacity-70">
                                      <div className="flex justify-between items-start mb-2">
                                        <h4 className="font-bold text-zinc-300 text-lg">{job.title}</h4>
                                        <span className="text-zinc-500 text-xs uppercase font-bold">{job.status}</span>
                                      </div>
                                      <p className="text-sm text-zinc-500">{job.industry}</p>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="pt-8 border-t border-white/5">
                        <div className="flex items-center justify-between mb-6">
                          <h3 className="text-xl font-bold text-white flex items-center gap-2">
                            <span className="text-yellow-400">⭐</span>
                            Work History & Reviews
                          </h3>
                          {totalReviews === 0 && (
                            <Button variant="outline" size="sm" onClick={seedData} className="border-green-500/30 text-green-400 hover:bg-green-500/10">
                              Create Sample Data
                            </Button>
                          )}
                        </div>

                        {isLoadingReviews ? (
                          <div className="animate-pulse flex space-x-4 p-6 bg-black/30 rounded-2xl border border-white/5">
                            <div className="flex-1 space-y-4 py-1">
                              <div className="h-2 bg-zinc-800 rounded w-3/4"></div>
                              <div className="space-y-3">
                                <div className="h-2 bg-zinc-800 rounded"></div>
                                <div className="h-2 bg-zinc-800 rounded w-5/6"></div>
                              </div>
                            </div>
                          </div>
                        ) : totalReviews === 0 ? (
                          <div className="bg-black/30 rounded-2xl p-8 border border-white/5 text-center">
                            <p className="text-zinc-500 italic">No reviews yet. Complete jobs via smart contract to build your on-chain reputation.</p>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {reviews.map((review) => (
                              <div key={review.id} className="bg-black/30 rounded-2xl p-6 border border-white/5 hover:border-white/10 transition-colors">
                                <div className="flex justify-between items-start mb-4">
                                  <div>
                                    <h4 className="font-bold text-white text-lg">{review.job?.title}</h4>
                                    <p className="text-sm text-green-400 font-mono mt-1">{review.job?.industry}</p>
                                  </div>
                                  <div className="text-right">
                                    <div className="flex items-center text-yellow-400 gap-1 text-sm font-bold">
                                      {Array.from({ length: 5 }).map((_, i) => (
                                        <span key={i} className={i < review.rating ? "opacity-100" : "opacity-30"}>★</span>
                                      ))}
                                      <span className="ml-1">{review.rating}.0</span>
                                    </div>
                                    <p className="text-xs text-zinc-500 mt-1">
                                      {new Date(review.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                                    </p>
                                  </div>
                                </div>
                                <p className="text-zinc-300 text-sm leading-relaxed mb-4">"{review.comment}"</p>
                                <div className="flex items-center gap-2 pt-4 border-t border-white/5">
                                  <div className="w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-bold text-white">
                                    {review.reviewer?.firstName?.charAt(0) || "U"}
                                  </div>
                                  <span className="text-xs text-zinc-400">
                                    Reviewed by <span className="text-white font-medium">{review.reviewer?.firstName} {review.reviewer?.lastName}</span>
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                  </motion.div>
                ) : (
                  <motion.div 
                    key="edit"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-8"
                  >
                    <div className="mb-6">
                      <h2 className="text-2xl font-bold">Edit Profile</h2>
                      <p className="text-zinc-400">Update your information across the TrustFlow network.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-zinc-400">First Name <span className="text-red-500">*</span></label>
                        <Input name="firstName" value={formData.firstName} onChange={handleInputChange} className="bg-black border-white/10 focus-visible:ring-white/20 h-12 rounded-xl text-white" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-zinc-400">Last Name <span className="text-red-500">*</span></label>
                        <Input name="lastName" value={formData.lastName} onChange={handleInputChange} className="bg-black border-white/10 focus-visible:ring-white/20 h-12 rounded-xl text-white" />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-zinc-400">Email Address <span className="text-red-500">*</span></label>
                        <Input name="email" type="email" value={formData.email} onChange={handleInputChange} className="bg-black border-white/10 focus-visible:ring-white/20 h-12 rounded-xl text-white" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-zinc-400">Phone Number</label>
                        <Input name="phone" value={formData.phone} onChange={handleInputChange} className="bg-black border-white/10 focus-visible:ring-white/20 h-12 rounded-xl text-white" />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-zinc-400">Location</label>
                        <Input name="location" value={formData.location} onChange={handleInputChange} className="bg-black border-white/10 focus-visible:ring-white/20 h-12 rounded-xl text-white" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-zinc-400">Website / Portfolio</label>
                        <Input name="website" value={formData.website} onChange={handleInputChange} className="bg-black border-white/10 focus-visible:ring-white/20 h-12 rounded-xl text-white" />
                      </div>
                    </div>

                    <div className="space-y-2 pt-2">
                      <label className="text-sm font-bold text-zinc-400">
                        {formData.role === 'client' ? 'Company Bio' : 'Professional Bio'}
                      </label>
                      <Textarea name="bio" value={formData.bio} onChange={handleInputChange} className="bg-black border-white/10 focus-visible:ring-white/20 min-h-[120px] rounded-xl text-white" />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-bold text-zinc-400">
                        {formData.role === 'client' ? 'Industry' : 'Skills (Comma separated)'}
                      </label>
                      <Input name="skills" value={formData.skills} onChange={handleInputChange} className="bg-black border-white/10 focus-visible:ring-white/20 h-12 rounded-xl text-white" />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
