import React, { useState, useEffect } from "react";
import { GraduationCap, BookOpen, RefreshCw, Send, AlertCircle, ChevronRight, School, LogIn, Target, Zap, Shield, Sparkles, X, Trophy, Award, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { googleSignIn } from "../lib/firebase";

interface Course {
  id: string;
  name: string;
  section?: string;
  descriptionHeading?: string;
  alternateLink: string;
}

interface ClassroomProps {
  accessToken: string | null;
}

export default function GoogleClassroomIntegration({ accessToken }: ClassroomProps) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const [posting, setPosting] = useState(false);

  // Quiz State
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizData, setQuizData] = useState<any>(null);
  const [loadingQuiz, setLoadingQuiz] = useState(false);
  const [quizStep, setQuizStep] = useState(0);
  const [score, setScore] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);
  const [showCertificate, setShowCertificate] = useState(false);

  const fetchCourses = async () => {
    if (!accessToken) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("https://classroom.googleapis.com/v1/courses", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (response.status === 403) {
        throw new Error("Access Denied: You may need to grant Classroom permissions. Try connecting your account again.");
      }
      if (!response.ok) throw new Error(`Failed to fetch courses (Status: ${response.status})`);
      const data = await response.json();
      setCourses(data.courses || []);
    } catch (err: any) {
      console.error("Classroom Error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const postAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken || !selectedCourse || !announcement.trim()) return;
    setPosting(true);
    try {
      const response = await fetch(`https://classroom.googleapis.com/v1/courses/${selectedCourse}/announcements`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text: announcement }),
      });
      if (!response.ok) throw new Error("Failed to post announcement");
      setAnnouncement("");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setPosting(false);
    }
  };

  const startQuiz = async () => {
    const course = courses.find(c => c.id === selectedCourse);
    if (!course) return;
    
    setLoadingQuiz(true);
    setShowQuiz(true);
    setQuizFinished(false);
    setScore(0);
    setQuizStep(0);
    try {
      const res = await fetch("/api/quiz/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: course.name, level: "Intermediate" })
      });
      const data = await res.json();
      if (data && data.questions && Array.isArray(data.questions)) {
        setQuizData(data.questions);
      } else {
        throw new Error("Invalid quiz data received");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingQuiz(false);
    }
  };

  const handleAnswer = (index: number) => {
    if (index === quizData[quizStep].correctIndex) {
      setScore(score + 1);
    }
    if (quizStep + 1 < quizData.length) {
      setQuizStep(quizStep + 1);
    } else {
      setQuizFinished(true);
    }
  };

  useEffect(() => {
    if (accessToken) fetchCourses();
  }, [accessToken]);

  if (!accessToken) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-neutral-900 border border-neutral-800 p-16 rounded-3xl text-center max-w-2xl mx-auto"
      >
        <div className="w-20 h-20 bg-rose-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <School className="text-rose-400" size={40} />
        </div>
        <h3 className="text-2xl font-bold text-white mb-3 tracking-tight">Classroom AI Guided</h3>
        <p className="text-neutral-500 mb-8 max-w-sm mx-auto text-sm leading-relaxed">
          Manage your trading courses and post announcements to your class. Connect your account to sync your Google Classroom data.
        </p>
        <button
          onClick={() => googleSignIn()}
          className="bg-rose-500 hover:bg-rose-600 text-white px-8 py-4 rounded-2xl font-bold text-sm transition-all shadow-xl shadow-rose-500/20 flex items-center gap-3 mx-auto"
        >
          <LogIn size={20} /> Connect Workspace
        </button>
      </motion.div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-rose-500/10 rounded-lg">
            <School className="text-rose-400" size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white tracking-tight">Classroom AI Guided</h2>
            <p className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest">Sera Intelligence Bureau</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {showCertificate && (
            <button 
              onClick={() => setShowCertificate(true)}
              className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-[10px] font-bold text-amber-400 uppercase tracking-widest animate-pulse"
            >
              <Award size={14} /> My Certificate
            </button>
          )}
          <button
            onClick={fetchCourses}
            disabled={loading}
            className="p-2 bg-neutral-900 border border-neutral-800 text-neutral-400 rounded-xl hover:border-neutral-700 transition-all"
          >
            <RefreshCw className={loading ? "animate-spin" : ""} size={18} />
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-rose-500/10 border border-rose-500/20 p-4 rounded-2xl flex items-center gap-3 text-rose-400 text-xs">
          <AlertCircle size={16} />
          <p>{error}</p>
          <button onClick={() => setError(null)} className="ml-auto hover:text-white">
            <X size={14} />
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Course List */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
            <BookOpen size={16} className="text-rose-400" /> Active AI Courses
          </h3>
          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
            {loading ? (
              [1, 2, 3].map(i => <div key={i} className="h-16 bg-neutral-850 rounded-xl animate-pulse" />)
            ) : courses.length === 0 ? (
              <div className="py-8 text-center text-neutral-500 text-xs">No active courses found.</div>
            ) : (
              courses.map(course => (
                <button
                  key={course.id}
                  onClick={() => setSelectedCourse(course.id)}
                  className={`w-full text-left p-4 rounded-xl border transition-all ${
                    selectedCourse === course.id
                      ? "bg-rose-500/10 border-rose-500/40"
                      : "bg-neutral-950 border-neutral-850 hover:border-neutral-700"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold text-white text-sm">{course.name}</p>
                      <p className="text-[10px] text-neutral-500 mt-1">{course.section || "No Section"}</p>
                    </div>
                    <ChevronRight size={16} className={selectedCourse === course.id ? "text-rose-400" : "text-neutral-700"} />
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Post Announcement */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
            <Send size={16} className="text-rose-400" /> Post Signal to Class
          </h3>
          {selectedCourse ? (
            <form onSubmit={postAnnouncement} className="space-y-4">
              <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-850">
                <p className="text-[10px] font-mono text-neutral-500 uppercase mb-2">Targeting Course:</p>
                <p className="text-xs font-bold text-white">{courses.find(c => c.id === selectedCourse)?.name}</p>
              </div>
              <textarea
                value={announcement}
                onChange={(e) => setAnnouncement(e.target.value)}
                placeholder="Share a trade signal, market update, or lesson announcement..."
                className="w-full bg-neutral-950 border border-neutral-850 rounded-xl p-4 text-sm text-white h-24 focus:outline-none focus:border-rose-500/50 transition-all resize-none"
              />
              <button
                type="submit"
                disabled={posting || !announcement.trim()}
                className="w-full py-3 bg-rose-500 hover:bg-rose-600 text-white rounded-xl font-bold text-sm transition-all shadow-lg shadow-rose-500/20 flex items-center justify-center gap-2"
              >
                {posting ? <RefreshCw className="animate-spin" size={18} /> : <Send size={18} />}
                Post Announcement
              </button>
            </form>
          ) : (
            <div className="py-16 text-center space-y-4">
              <AlertCircle className="mx-auto text-neutral-800" size={48} />
              <p className="text-neutral-500 text-sm">Select a course to post an announcement.</p>
            </div>
          )}
        </div>

        {/* AI Quiz Section */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Sparkles size={48} className="text-rose-400" />
          </div>
          <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
            <Target size={16} className="text-rose-400" /> AI Class Quiz
          </h3>
          <p className="text-xs text-neutral-500 mb-6 leading-relaxed">
            Sera automatically generates lesson-specific quizzes for your classroom. Verify student mastery in real-time.
          </p>
          <button 
            onClick={startQuiz}
            disabled={!selectedCourse}
            className="w-full py-4 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/40 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {loadingQuiz ? <RefreshCw size={14} className="animate-spin" /> : <Shield size={14} />}
            Generate Lesson Quiz
          </button>
        </div>
      </div>

      {/* Quiz Modal */}
      <AnimatePresence>
        {showQuiz && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowQuiz(false)}
              className="absolute inset-0 bg-neutral-950/90 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-xl bg-neutral-900 border border-neutral-800 rounded-3xl p-8 shadow-2xl overflow-hidden"
            >
              <button onClick={() => setShowQuiz(false)} className="absolute top-4 right-4 text-neutral-500 hover:text-white">
                <X size={24} />
              </button>

              {loadingQuiz ? (
                <div className="py-20 text-center space-y-4">
                  <RefreshCw className="animate-spin mx-auto text-rose-500" size={48} />
                  <p className="text-neutral-400 font-mono text-sm uppercase tracking-widest">Sera is preparing the classroom challenge...</p>
                </div>
              ) : quizFinished ? (
                <div className="py-10 text-center space-y-6">
                  <div className="w-20 h-20 bg-rose-500/20 rounded-full flex items-center justify-center mx-auto">
                    <Trophy className="text-rose-500" size={40} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-white mb-2">Quiz Complete!</h3>
                    <p className="text-neutral-400 text-sm">You scored {score} out of {quizData.length} questions correctly.</p>
                  </div>
                  {score === quizData.length ? (
                    <div className="space-y-4">
                      <p className="text-emerald-400 text-xs font-bold uppercase tracking-widest">Mastery Achieved</p>
                      <button 
                        onClick={() => {
                          setShowQuiz(false);
                          setShowCertificate(true);
                        }}
                        className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-neutral-950 rounded-2xl font-bold transition-all shadow-xl shadow-emerald-500/20"
                      >
                        Claim Completion Certificate
                      </button>
                    </div>
                  ) : (
                    <button 
                      onClick={startQuiz}
                      className="w-full py-4 bg-rose-500 hover:bg-rose-600 text-white rounded-2xl font-bold transition-all"
                    >
                      Retry Challenge
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-8">
                  <div>
                    <p className="text-[10px] font-mono text-rose-500 uppercase tracking-widest mb-2">Class Quiz: Question {quizStep + 1} of {quizData.length}</p>
                    <h3 className="text-xl font-bold text-white leading-tight">{quizData[quizStep].question}</h3>
                  </div>
                  <div className="grid grid-cols-1 gap-3">
                    {quizData[quizStep].options.map((option: string, i: number) => (
                      <button
                        key={i}
                        onClick={() => handleAnswer(i)}
                        className="w-full text-left p-4 bg-neutral-950 border border-neutral-850 rounded-2xl text-sm text-neutral-300 hover:border-rose-500/50 hover:text-white transition-all group"
                      >
                        <span className="inline-block w-6 text-rose-500 font-mono">{String.fromCharCode(65 + i)}.</span>
                        {option}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Certificate Modal */}
      <AnimatePresence>
        {showCertificate && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCertificate(false)}
              className="absolute inset-0 bg-neutral-950/95 backdrop-blur-xl"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="relative w-full max-w-2xl aspect-[1.4/1] bg-white rounded shadow-2xl p-12 overflow-hidden border-[12px] border-amber-900/10"
            >
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')] opacity-50" />
              <div className="absolute top-8 left-8 right-8 bottom-8 border-2 border-amber-900/20 pointer-events-none" />
              
              <div className="relative h-full flex flex-col items-center justify-center text-center space-y-6">
                <Award size={64} className="text-amber-600 mb-4" />
                <h1 className="text-4xl font-serif text-neutral-900 tracking-tight">Certificate of Achievement</h1>
                <div className="w-16 h-0.5 bg-amber-600" />
                <p className="text-sm font-mono text-neutral-500 uppercase tracking-[0.3em]">Classroom Mastery</p>
                <p className="text-3xl font-serif text-neutral-900 italic">Financial Student</p>
                <p className="text-sm text-neutral-600 max-w-sm leading-relaxed">
                  Successfully verified proficiency in the course <span className="font-bold text-neutral-900">{courses.find(c => c.id === selectedCourse)?.name}</span> 
                  via AI-guided assessment by <span className="font-bold">Sera Intel</span>.
                </p>
                <div className="pt-8 flex items-center gap-12">
                  <div className="text-center">
                    <div className="w-32 h-px bg-neutral-300 mb-2" />
                    <p className="text-[10px] font-mono text-neutral-400">CLASSROOM BUREAU</p>
                  </div>
                  <div className="w-20 h-20 border-4 border-amber-600/20 rounded-full flex items-center justify-center opacity-40">
                    <CheckCircle2 size={32} className="text-amber-600" />
                  </div>
                  <div className="text-center">
                    <div className="w-32 h-px bg-neutral-300 mb-2" />
                    <p className="text-[10px] font-mono text-neutral-400">DATE: {new Date().toLocaleDateString()}</p>
                  </div>
                </div>
              </div>
              
              <button 
                onClick={() => setShowCertificate(false)}
                className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-900 transition-colors"
              >
                <X size={20} />
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

