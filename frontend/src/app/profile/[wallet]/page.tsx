"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Briefcase, Mail, Phone, MapPin, Globe, Code, Calendar, UserCircle } from "lucide-react";

export default function FreelancerProfile() {
  const params = useParams();
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [averageRating, setAverageRating] = useState<number>(0);
  const [totalReviews, setTotalReviews] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!params.wallet) return;
    
    // Fetch user profile
    fetch(`/api/users/${params.wallet}`)
      .then(res => res.json())
      .then(data => {
        if (!data.error) {
          setProfile(data);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });

    // Fetch reviews
    fetch(`/api/users/${params.wallet}/reviews`)
      .then(res => res.json())
      .then(data => {
        if (!data.error) {
          setReviews(data.reviews || []);
          setAverageRating(data.averageRating || 0);
          setTotalReviews(data.totalReviews || 0);
        }
      })
      .catch(console.error);
  }, [params.wallet]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] text-white flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-[#050505] text-white flex flex-col items-center justify-center gap-4">
        <h1 className="text-2xl font-bold">Profile not found</h1>
        <Button variant="outline" onClick={() => router.back()}>Go Back</Button>
      </div>
    );
  }

  const skillsList = profile.skills ? profile.skills.split(",").map((s: string) => s.trim()) : [];

  return (
    <div className="min-h-screen bg-[#050505] text-white relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-green-500/10 blur-[120px] rounded-full pointer-events-none"></div>

      <div className="max-w-4xl mx-auto p-8 md:p-12 relative z-10">
        <Button 
          variant="ghost" 
          onClick={() => router.back()}
          className="text-zinc-400 hover:text-white hover:bg-zinc-900 rounded-xl mb-8"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <div className="bg-zinc-900/40 border border-white/5 rounded-3xl overflow-hidden backdrop-blur-xl relative shadow-2xl">
          <div className="h-40 bg-gradient-to-br from-green-600/30 via-emerald-500/20 to-blue-500/20 relative"></div>
          
          <div className="px-8 pb-8 relative">
            <div className="absolute -top-16 left-8 w-32 h-32 rounded-2xl bg-zinc-800 border-4 border-zinc-900 flex items-center justify-center text-5xl font-bold text-white shadow-xl overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
              {profile.firstName?.charAt(0)}{profile.lastName?.charAt(0)}
            </div>
            
            <div className="pt-20 pb-6 border-b border-white/5 flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-bold mb-1 tracking-tight">{profile.firstName} {profile.lastName}</h1>
                <p className="text-zinc-500 font-mono text-sm mb-4 break-all max-w-md">
                  {profile.walletAddress}
                </p>
                <span className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider bg-green-500/10 text-green-400 border border-green-500/20">
                  <Code className="w-3 h-3 mr-1.5" />
                  {profile.role}
                </span>
                
                {totalReviews > 0 && (
                  <div className="mt-4 flex items-center gap-2">
                    <div className="flex items-center text-yellow-400">
                      <span className="text-xl">⭐</span>
                      <span className="font-bold ml-1 text-lg">{averageRating.toFixed(1)}</span>
                    </div>
                    <span className="text-zinc-500">({totalReviews} Reviews)</span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8">
              <div className="space-y-8">
                <div>
                  <h3 className="text-lg font-bold text-white mb-3">About</h3>
                  <div className="bg-black/30 p-5 rounded-xl border border-white/5">
                    <p className="text-zinc-300 leading-relaxed whitespace-pre-wrap break-words">{profile.bio || "No bio provided."}</p>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-white mb-3">Skills & Expertise</h3>
                  <div className="flex flex-wrap gap-2">
                    {skillsList.length > 0 ? (
                      skillsList.map((skill: string, index: number) => (
                        <span key={index} className="bg-white/5 border border-white/10 px-3 py-1.5 rounded-lg text-sm text-zinc-300 font-medium">
                          {skill}
                        </span>
                      ))
                    ) : (
                      <span className="text-zinc-500 text-sm italic">No skills listed.</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-8">
                <div>
                  <h3 className="text-lg font-bold text-white mb-3">Contact Info</h3>
                  <div className="bg-black/30 p-5 rounded-xl border border-white/5 space-y-4">
                    <div className="flex items-center gap-3 text-zinc-300">
                      <Mail className="w-5 h-5 text-zinc-500" />
                      <span className="break-all">{profile.email || "Hidden"}</span>
                    </div>
                    {profile.phone && (
                      <div className="flex items-center gap-3 text-zinc-300">
                        <Phone className="w-5 h-5 text-zinc-500" />
                        <span>{profile.phone}</span>
                      </div>
                    )}
                    {profile.location && (
                      <div className="flex items-center gap-3 text-zinc-300">
                        <MapPin className="w-5 h-5 text-zinc-500" />
                        <span>{profile.location}</span>
                      </div>
                    )}
                    {profile.website && (
                      <div className="flex items-center gap-3 text-blue-400">
                        <Globe className="w-5 h-5 text-zinc-500" />
                        <a href={profile.website} target="_blank" rel="noopener noreferrer" className="hover:underline break-all">
                          {profile.website}
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>
          </div>
          
          {/* Reviews and Past Jobs Section */}
          <div className="border-t border-white/5 bg-black/20 p-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <span className="text-yellow-400">⭐</span>
                Work History & Reviews
              </h3>
            </div>

            {totalReviews === 0 ? (
              <div className="bg-black/30 rounded-2xl p-8 border border-white/5 text-center">
                <p className="text-zinc-500 italic">No reviews yet for this user.</p>
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
        </div>
        </div>
      </div>
    </div>
  );
}
