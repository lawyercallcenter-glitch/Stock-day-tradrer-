import React, { useState, useEffect, useRef } from "react";
import { Youtube, Upload, RefreshCw, Trash2, ExternalLink, Play, Layout, LogIn, CheckCircle2, AlertCircle, Search, Video, GraduationCap, Copy, Check, Sparkles, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { googleSignIn, db } from "../lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

interface YouTubeVideo {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  publishedAt: string;
  videoId: string;
}

export default function YouTubeManager({ accessToken }: { accessToken?: string | null }) {
  const [videos, setVideos] = useState<YouTubeVideo[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [promoting, setPromoting] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isUploadingMode, setIsUploadingMode] = useState(false);
  const [aiTopic, setAiTopic] = useState("");
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [aiResult, setAiResult] = useState<any>(null);
  
  const [uploadData, setUploadData] = useState({
    title: "",
    description: "Trading setup and analysis by @stockremix26",
    privacyStatus: "unlisted" as "public" | "unlisted" | "private",
    file: null as File | null
  });

  const generateAiClass = async () => {
    if (!aiTopic.trim()) return;
    setIsAiGenerating(true);
    setError(null);
    try {
      const response = await fetch("/api/gemini/generate-academy-content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: aiTopic })
      });
      if (!response.ok) {
        let errorMessage = "AI generation failed";
        try {
          const data = await response.json();
          setAiResult(data);
          setUploadData(prev => ({
            ...prev,
            title: data.title,
            description: data.description
          }));
          setSuccess("AI has drafted your academy class!");
          setTimeout(() => setSuccess(null), 3000);
        } catch (e) {
          throw new Error(`AI generation failed: ${response.statusText}`);
        }
        return;
      }
      
      const data = await response.json();
      setAiResult(data);
      setUploadData(prev => ({
        ...prev,
        title: data.title,
        description: data.description
      }));
      setSuccess("AI has drafted your academy class!");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsAiGenerating(false);
    }
  };

  const fetchVideos = async () => {
    if (!accessToken) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("https://www.googleapis.com/youtube/v3/search?part=snippet&forMine=true&type=video&maxResults=50", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!response.ok) throw new Error(`Failed to fetch YouTube videos: ${response.status}`);
      
      const text = await response.text();
      if (!text) {
        setVideos([]);
        return;
      }
      const data = JSON.parse(text);
      
      const mapped = (data.items || []).map((item: any) => ({
        id: item.id.videoId,
        videoId: item.id.videoId,
        title: item.snippet.title,
        description: item.snippet.description,
        thumbnail: item.snippet.thumbnails.high.url,
        publishedAt: item.snippet.publishedAt
      }));
      setVideos(mapped);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const promoteToAcademy = async (video: YouTubeVideo) => {
    setPromoting(video.id);
    setError(null);
    try {
      await addDoc(collection(db, "academy_modules"), {
        title: video.title,
        description: video.description,
        videoId: video.videoId,
        thumbnail: video.thumbnail,
        level: "Academy Upload",
        duration: "Variable",
        color: "rose",
        createdAt: serverTimestamp()
      });
      setSuccess(`"${video.title}" added to Education Center!`);
      setTimeout(() => setSuccess(null), 5000);
    } catch (err: any) {
      setError("Failed to promote video to Academy. Check permissions.");
    } finally {
      setPromoting(null);
    }
  };

  const copyId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setUploadData(prev => ({ ...prev, file: e.target.files![0] }));
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken || !uploadData.file || !uploadData.title.trim()) return;

    setUploading(true);
    setError(null);
    setSuccess(null);

    try {
      // Step 1: Metadata
      const metadata = {
        snippet: {
          title: uploadData.title,
          description: uploadData.description,
          tags: ["trading", "stocks", "daytrading", "stockremix26"],
          categoryId: "27" // Education
        },
        status: {
          privacyStatus: uploadData.privacyStatus
        }
      };

      const formData = new FormData();
      formData.append(
        "metadata",
        new Blob([JSON.stringify(metadata)], { type: "application/json" })
      );
      formData.append("file", uploadData.file);

      const response = await fetch("https://www.googleapis.com/upload/youtube/v3/videos?uploadType=multipart&part=snippet,status", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`
        },
        body: formData
      });

      if (!response.ok) {
        let errorMessage = "Upload failed";
        try {
          const errorText = await response.text();
          if (errorText) {
            const errorData = JSON.parse(errorText);
            errorMessage = errorData.error?.message || errorMessage;
          }
        } catch (e) {
          errorMessage = `Upload failed with status ${response.status}`;
        }
        throw new Error(errorMessage);
      }

      setSuccess("Video uploaded successfully to @stockremix26!");
      setUploadData({
        title: "",
        description: "Trading setup and analysis by @stockremix26",
        privacyStatus: "unlisted",
        file: null
      });
      setIsUploadingMode(false);
      fetchVideos();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  useEffect(() => {
    if (accessToken) fetchVideos();
  }, [accessToken]);

  if (!accessToken) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-neutral-900 border border-neutral-800 p-16 rounded-3xl text-center max-w-2xl mx-auto"
      >
        <div className="w-20 h-20 bg-rose-500/10 rounded-full flex items-center justify-center mx-auto mb-6 text-rose-500">
          <Youtube size={40} />
        </div>
        <h3 className="text-2xl font-bold text-white mb-3 tracking-tight">YouTube Channel Integration</h3>
        <p className="text-neutral-500 mb-8 max-w-sm mx-auto text-sm leading-relaxed">
          Manage your @stockremix26 channel. Upload analysis videos, trading recaps, and live sessions directly from the Sera dashboard.
        </p>
        <button
          onClick={() => googleSignIn()}
          className="bg-rose-600 hover:bg-rose-700 text-white px-8 py-4 rounded-2xl font-bold text-sm transition-all shadow-xl shadow-rose-600/20 flex items-center gap-3 mx-auto"
        >
          <LogIn size={20} /> Connect YouTube Account
        </button>
      </motion.div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-rose-500/10 rounded-2xl text-rose-500">
            <Youtube size={32} />
          </div>
          <div>
            <h2 className="text-3xl font-black text-white tracking-tighter">YouTube <span className="text-rose-500">Channel Manager</span></h2>
            <p className="text-neutral-500 text-xs font-mono uppercase tracking-widest mt-1">@stockremix26 Active Integration</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchVideos}
            disabled={loading}
            className="p-3 bg-neutral-900 border border-neutral-800 text-neutral-400 rounded-xl hover:border-neutral-700 transition-all active:scale-95"
          >
            <RefreshCw className={loading ? "animate-spin" : ""} size={20} />
          </button>
          <button 
            onClick={() => setIsUploadingMode(true)}
            className="flex items-center gap-2 bg-neutral-900 border border-neutral-800 text-white px-6 py-3 rounded-xl font-bold text-sm transition-all hover:border-rose-500/50 active:scale-95"
          >
            <Upload size={20} /> Upload Video
          </button>
          <button 
            onClick={() => {
              setIsUploadingMode(true);
              setAiResult(null);
            }}
            className="flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white px-6 py-3 rounded-xl font-bold text-sm transition-all shadow-lg shadow-rose-600/20 active:scale-95"
          >
            <Sparkles size={20} /> AI Class Architect
          </button>
        </div>
      </div>

      {error && (
        <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-400 text-sm flex items-center gap-3">
          <AlertCircle size={20} />
          <p>{error}</p>
        </motion.div>
      )}

      {success && (
        <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-400 text-sm flex items-center gap-3">
          <CheckCircle2 size={20} />
          <p>{success}</p>
        </motion.div>
      )}

      <AnimatePresence>
        {isUploadingMode && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-neutral-900 border border-rose-500/30 rounded-3xl p-8 space-y-6 shadow-2xl relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-8 opacity-5">
              <Upload size={120} />
            </div>
            <div className="flex justify-between items-center relative z-10">
              <h3 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                {aiResult ? <CheckCircle2 className="text-emerald-400" /> : <Sparkles className="text-rose-500" />}
                {aiResult ? "AI Draft Complete" : "AI Class Architect"}
              </h3>
              <button onClick={() => { setIsUploadingMode(false); setAiResult(null); }} className="text-neutral-500 hover:text-white transition-colors uppercase text-[10px] font-black tracking-widest">
                Cancel
              </button>
            </div>

            {!aiResult && (
              <div className="relative z-10 space-y-4">
                <div className="p-6 bg-rose-500/5 border border-rose-500/10 rounded-2xl">
                  <label className="text-[10px] font-mono text-rose-500 uppercase tracking-widest mb-3 block">What should the AI build for @stockremix26?</label>
                  <div className="flex gap-3">
                    <input 
                      type="text" 
                      value={aiTopic}
                      onChange={(e) => setAiTopic(e.target.value)}
                      placeholder="e.g., How to spot institutional buying in NVDA"
                      className="flex-1 bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-rose-500/50 transition-all"
                    />
                    <button 
                      onClick={generateAiClass}
                      disabled={isAiGenerating || !aiTopic.trim()}
                      className="bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white px-6 py-3 rounded-xl font-bold text-sm transition-all shadow-lg shadow-rose-600/20"
                    >
                      {isAiGenerating ? <RefreshCw className="animate-spin" size={20} /> : <Sparkles size={20} />}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {aiResult && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="relative z-10 space-y-6">
                <div className="p-6 bg-neutral-950 border border-neutral-800 rounded-2xl space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-500">
                      <Layout size={20} />
                    </div>
                    <div>
                      <p className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest mb-1">Generated Script Outline</p>
                      <div className="text-sm text-neutral-300 whitespace-pre-wrap leading-relaxed max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                        {aiResult.script_outline}
                      </div>
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t border-neutral-900 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest mb-1">Suggested Tags</p>
                      <div className="flex flex-wrap gap-2">
                        {aiResult.tags.map((tag: string) => (
                          <span key={tag} className="px-2 py-1 bg-neutral-900 border border-neutral-800 rounded text-[9px] text-neutral-400">#{tag}</span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest mb-1">AI Recommendation</p>
                      <p className="text-[10px] text-emerald-400">Metadata is optimized for YouTube @stockremix26 search visibility.</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
            
            <form onSubmit={handleUpload} className="space-y-5 relative z-10">
              <div className="space-y-2">
                <label className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest">Video File</label>
                <div className="relative h-32 bg-neutral-950 border-2 border-dashed border-neutral-800 rounded-2xl flex flex-col items-center justify-center group hover:border-rose-500/30 transition-all cursor-pointer">
                  <input
                    type="file"
                    accept="video/*"
                    onChange={handleFileChange}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  {uploadData.file ? (
                    <div className="text-center">
                      <Video className="mx-auto text-emerald-400 mb-2" size={24} />
                      <p className="text-xs text-white font-bold">{uploadData.file.name}</p>
                      <p className="text-[10px] text-neutral-500">{(uploadData.file.size / (1024 * 1024)).toFixed(2)} MB</p>
                    </div>
                  ) : (
                    <div className="text-center">
                      <Upload className="mx-auto text-neutral-700 group-hover:text-rose-500 transition-colors mb-2" size={24} />
                      <p className="text-xs text-neutral-500">Drop video here or click to browse</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest">Video Title</label>
                  <input
                    type="text"
                    value={uploadData.title}
                    onChange={(e) => setUploadData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="e.g., NVDA Breakout Analysis - $140 Target"
                    className="w-full bg-neutral-950 border border-neutral-850 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-rose-500/50 transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest">Privacy Status</label>
                  <select
                    value={uploadData.privacyStatus}
                    onChange={(e: any) => setUploadData(prev => ({ ...prev, privacyStatus: e.target.value }))}
                    className="w-full bg-neutral-950 border border-neutral-850 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-rose-500/50 transition-all"
                  >
                    <option value="unlisted">Unlisted (Hidden)</option>
                    <option value="public">Public (Visible to All)</option>
                    <option value="private">Private (Only You)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest">Description</label>
                <textarea
                  value={uploadData.description}
                  onChange={(e) => setUploadData(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="w-full bg-neutral-950 border border-neutral-850 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-rose-500/50 transition-all resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={uploading || !uploadData.file || !uploadData.title.trim()}
                className="w-full py-4 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white rounded-2xl font-black text-sm transition-all shadow-xl shadow-rose-600/20 flex items-center justify-center gap-3"
              >
                {uploading ? <RefreshCw className="animate-spin" size={20} /> : <Upload size={20} />}
                {uploading ? "UPLOADING TO YOUTUBE..." : "PUBLISH TO @STOCKREMIX26"}
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading && videos.length === 0 ? (
          [1, 2, 3, 4, 5, 6].map(i => <div key={i} className="h-64 bg-neutral-900 rounded-3xl animate-pulse border border-neutral-800" />)
        ) : videos.length === 0 ? (
          <div className="col-span-full py-32 text-center space-y-4 bg-neutral-900 border border-neutral-800 rounded-3xl">
            <Video className="mx-auto text-neutral-800" size={64} />
            <p className="text-neutral-500 text-sm max-w-xs mx-auto">No videos found on your channel yet. Start uploading your analysis.</p>
          </div>
        ) : (
          videos.map((v) => (
            <motion.div 
              key={v.id} 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-neutral-900 border border-neutral-800 rounded-3xl overflow-hidden hover:border-rose-500/30 transition-all group shadow-xl"
            >
              <div className="relative aspect-video">
                <img src={v.thumbnail} alt={v.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <a 
                    href={`https://www.youtube.com/watch?v=${v.videoId}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="p-4 bg-rose-600 rounded-full text-white shadow-2xl active:scale-95 transition-transform"
                  >
                    <Play size={24} fill="white" />
                  </a>
                </div>
              </div>
              <div className="p-5">
                <h4 className="font-bold text-white text-sm mb-2 line-clamp-1 group-hover:text-rose-500 transition-colors">
                  {v.title}
                </h4>
                <p className="text-[10px] text-neutral-500 font-mono uppercase tracking-widest mb-4">
                  Published: {new Date(v.publishedAt).toLocaleDateString()}
                </p>
                <div className="flex items-center justify-between pt-4 border-t border-neutral-800/50">
                  <div className="flex gap-2">
                    <button 
                      onClick={() => copyId(v.videoId)}
                      className={`p-2 rounded-lg transition-all ${copiedId === v.videoId ? 'bg-emerald-500/10 text-emerald-400' : 'bg-neutral-800 text-neutral-500 hover:text-white'}`}
                      title="Copy Video ID"
                    >
                      {copiedId === v.videoId ? <Check size={14} /> : <Copy size={14} />}
                    </button>
                    <button 
                      onClick={() => promoteToAcademy(v)}
                      disabled={!!promoting}
                      className="p-2 bg-rose-500/10 text-rose-500 rounded-lg hover:bg-rose-500 hover:text-white transition-all disabled:opacity-50"
                      title="Add to Academy"
                    >
                      {promoting === v.id ? <RefreshCw size={14} className="animate-spin" /> : <GraduationCap size={14} />}
                    </button>
                  </div>
                  <div className="flex items-center gap-3">
                    <a 
                      href={`https://www.youtube.com/watch?v=${v.videoId}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-[10px] font-mono text-neutral-600 hover:text-rose-500 flex items-center gap-1 transition-colors uppercase tracking-widest"
                    >
                      View <ExternalLink size={10} />
                    </a>
                  </div>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
