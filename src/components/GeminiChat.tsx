import React, { useState, useRef, useEffect } from "react";
import { Send, Sparkles, User, HelpCircle, Bot, TrendingUp, BookOpen, Calculator, Loader2, Volume2, VolumeX, Mic, MicOff, Globe, ExternalLink, Phone, PhoneOff, Radio, Database } from "lucide-react";
import { pcmToBase64 } from "../lib/audio";
import { db, auth } from "../lib/firebase";
import { collection, getDocs } from "firebase/firestore";

interface Message {
  id: string;
  role: "user" | "assistant";
  text: string;
  timestamp: Date;
  sources?: { title: string; url: string; }[];
  searchQueries?: string[];
}

const STARTER_PROMPTS = [
  {
    label: "Analyze TSLA breakout",
    text: "Can you analyze TSLA's current symmetrical triangle squeeze? Give me a realistic day-trading setup with an entry trigger, target price, and stop-loss.",
    icon: TrendingUp,
  },
  {
    label: "Explain Moats & Compounding",
    text: "How do I spot a strong competitive moat for a long-term investment, and why does that accelerate portfolio compounding over 3-5 years?",
    icon: BookOpen,
  },
  {
    label: "ATR Scalp Strategy",
    text: "Explain how to use Average True Range (ATR) to measure volatility and calculate size discipline for active day trading.",
    icon: Calculator,
  },
  {
    label: "Analyze NVDA Blackwell Catalyst",
    text: "What is the technical impact of NVIDIA's Blackwell chips? Should I treat NVDA as a near-term day trade scalp or a long-term compounder?",
    icon: Sparkles,
  },
];

export default function GeminiChat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "initial-assistant-msg",
      role: "assistant",
      text: "Greetings. I am Sera, your elite trading co-pilot. Whether you are scalping short-term volatility in day trades or compounding strategic generational wealth in long-term portfolios, I am here with pure data-driven conviction. No assumptions, only logical setups. What asset or strategy are we scanning today?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Vocal & Speech Synthesis States
  const [isSpeaking, setIsSpeaking] = useState<string | null>(null); // message ID currently spoken
  const [autoRead, setAutoRead] = useState(true);
  const [selectedVoice, setSelectedVoice] = useState<string>("");
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  
  // Speech Recognition States
  const [isListening, setIsListening] = useState(false);
  const [recognitionError, setRecognitionError] = useState<string | null>(null);

  // Live API States
  const [liveMode, setLiveMode] = useState(false);
  const [liveInputText, setLiveInputText] = useState("");
  const [liveOutputText, setLiveOutputText] = useState("");
  const liveWsRef = useRef<WebSocket | null>(null);
  const inputAudioCtxRef = useRef<AudioContext | null>(null);
  const outputAudioCtxRef = useRef<AudioContext | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const nextStartTimeRef = useRef<number>(0);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // User Context State
  const [portfolios, setPortfolios] = useState<any[]>([]);
  const [journalEntries, setJournalEntries] = useState<any[]>([]);
  const [contextLoading, setContextLoading] = useState(false);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    setContextLoading(true);
    // Fetch portfolios
    const fetchContext = async () => {
      try {
        const pSnap = await getDocs(collection(db, "users", user.uid, "portfolios"));
        const pData = pSnap.docs.map(d => d.data());
        setPortfolios(pData);

        const jSnap = await getDocs(collection(db, "users", user.uid, "journal"));
        const jData = jSnap.docs.map(d => d.data());
        setJournalEntries(jData);
      } catch (err) {
        console.error("Error fetching AI context:", err);
      } finally {
        setContextLoading(false);
      }
    };

    fetchContext();
  }, []);

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      try {
        const rec = new SpeechRecognition();
        rec.continuous = false;
        rec.interimResults = false;
        rec.lang = "en-US";

        rec.onstart = () => {
          setIsListening(true);
          setRecognitionError(null);
        };

        rec.onerror = (event: any) => {
          console.error("Speech recognition error:", event.error);
          if (event.error === "not-allowed") {
            setRecognitionError("Mic access denied. Enable mic permissions in browser settings.");
          } else {
            setRecognitionError(`Voice input error: ${event.error}`);
          }
          setIsListening(false);
        };

        rec.onend = () => {
          setIsListening(false);
        };

        rec.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          if (transcript) {
            setInput((prev) => (prev ? `${prev} ${transcript}` : transcript));
          }
        };

        recognitionRef.current = rec;
      } catch (err) {
        console.warn("Speech recognition is blocked or unsupported in this sandboxed environment:", err);
      }
    }
  }, []);

  // Initialize Speech Synthesis Voices
  useEffect(() => {
    const loadVoices = () => {
      if (typeof window !== "undefined" && window.speechSynthesis) {
        const voices = window.speechSynthesis.getVoices();
        setAvailableVoices(voices);
        
        // Find natural sounding voice or fallback to default
        const defaultVoice = voices.find(
          (v) => v.lang.startsWith("en") && (v.name.includes("Google") || v.name.includes("Natural") || v.name.includes("Premium"))
        ) || voices.find((v) => v.lang.startsWith("en")) || voices[0];
        
        if (defaultVoice && !selectedVoice) {
          setSelectedVoice(defaultVoice.name);
        }
      }
    };

    loadVoices();
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }

    return () => {
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, [selectedVoice, availableVoices.length]);

  // Handle Speech synthesis speaking trigger
  const speakText = (text: string, msgId: string) => {
    if (liveMode) return; // Prevent synthesis if in Live Voice mode
    if (typeof window === "undefined" || !window.speechSynthesis) return;

    if (isSpeaking === msgId) {
      window.speechSynthesis.cancel();
      setIsSpeaking(null);
      return;
    }

    window.speechSynthesis.cancel();

    // Strip markdown bold asterisks, bullet points, brackets, and code syntax
    const cleanText = text
      .replace(/\*\*([^*]+)\*\*/g, "$1") 
      .replace(/`([^`]+)`/g, "$1") 
      .replace(/[-*]\s+/g, "") 
      .replace(/\s+/g, " ") 
      .trim();

    const utterance = new SpeechSynthesisUtterance(cleanText);
    
    if (selectedVoice) {
      const voice = availableVoices.find((v) => v.name === selectedVoice);
      if (voice) {
        utterance.voice = voice;
      }
    }

    utterance.onend = () => {
      setIsSpeaking(null);
    };

    utterance.onerror = () => {
      setIsSpeaking(null);
    };

    setIsSpeaking(msgId);
    window.speechSynthesis.speak(utterance);
  };

  const toggleListening = () => {
    if (!recognitionRef.current) {
      setRecognitionError("Speech recognition is not supported in this browser environment.");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      try {
        recognitionRef.current.start();
      } catch (err) {
        console.error("Failed to start voice recognition:", err);
      }
    }
  };

  const toggleLiveMode = async () => {
    if (liveMode) {
      // Disconnect
      if (liveWsRef.current) liveWsRef.current.close();
      if (inputAudioCtxRef.current) inputAudioCtxRef.current.close();
      if (outputAudioCtxRef.current) outputAudioCtxRef.current.close();
      if (audioStreamRef.current) audioStreamRef.current.getTracks().forEach(t => t.stop());
      
      setLiveMode(false);
      return;
    }

    try {
      const wsUrl = `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/live`;
      const ws = new WebSocket(wsUrl);
      liveWsRef.current = ws;

      const inputAudioCtx = new AudioContext({ sampleRate: 16000 });
      const outputAudioCtx = new AudioContext({ sampleRate: 24000 });
      inputAudioCtxRef.current = inputAudioCtx;
      outputAudioCtxRef.current = outputAudioCtx;

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioStreamRef.current = stream;

      const source = inputAudioCtx.createMediaStreamSource(stream);
      const processor = inputAudioCtx.createScriptProcessor(4096, 1, 1);
      
      processor.onaudioprocess = (e) => {
        if (ws.readyState === WebSocket.OPEN) {
          const base64 = pcmToBase64(e.inputBuffer.getChannelData(0));
          ws.send(JSON.stringify({ audio: base64 }));
        }
      };

      source.connect(processor);
      processor.connect(inputAudioCtx.destination);

      ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        if (msg.audio) {
          const binary = atob(msg.audio);
          const bytes = new Uint8Array(binary.length);
          for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
          const int16 = new Int16Array(bytes.buffer);
          
          const audioBuffer = outputAudioCtx.createBuffer(1, int16.length, 24000);
          const channelData = audioBuffer.getChannelData(0);
          for (let i = 0; i < int16.length; i++) channelData[i] = int16[i] / 0x8000;

          const sourceNode = outputAudioCtx.createBufferSource();
          sourceNode.buffer = audioBuffer;
          sourceNode.connect(outputAudioCtx.destination);

          const startTime = Math.max(outputAudioCtx.currentTime, nextStartTimeRef.current);
          sourceNode.start(startTime);
          nextStartTimeRef.current = startTime + audioBuffer.duration;
        }
        if (msg.interrupted) {
          nextStartTimeRef.current = outputAudioCtx.currentTime;
        }
        if (msg.inputTranscription) {
          setLiveInputText(msg.inputTranscription.text || "");
          if (msg.inputTranscription.finished) {
            setMessages(prev => [...prev, { id: Date.now().toString(), role: "user", text: msg.inputTranscription.text || "", timestamp: new Date() }]);
            setLiveInputText("");
          }
        }
        if (msg.outputTranscription) {
          setLiveOutputText(prevText => {
            const newText = prevText + (msg.outputTranscription.text || "");
            if (msg.outputTranscription.finished) {
              setMessages(prev => [...prev, { id: Date.now().toString(), role: "assistant", text: newText, timestamp: new Date() }]);
              return "";
            }
            return newText;
          });
        }
      };

      ws.onclose = () => {
        setLiveMode(false);
      };

      setLiveMode(true);
    } catch (err) {
      console.error("Failed to start Live Voice mode", err);
      alert("Failed to start Live Voice mode. Please check microphone permissions.");
    }
  };

  // Auto-scroll on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    if (!liveMode && !liveWsRef.current) {
      toggleLiveMode();
    }
  }, []);

  const handleAnalyzeContext = async () => {
    if (loading || contextLoading) return;
    
    setLoading(true);
    setError(null);

    const userMsg: Message = {
      id: Math.random().toString(36).substring(2, 9),
      role: "user",
      text: "Analyze my portfolios and trade journal. Give me an audit of my performance and psychology.",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);

    try {
      const res = await fetch("/api/gemini/analyze-context", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ portfolios, journalEntries }),
      });

      if (!res.ok) throw new Error("Failed to analyze context.");

      const data = await res.json();
      
      let analysisText = `## Portfolio Audit Results\n\n**Health Score: ${data.healthScore}/100**\n\n${data.summary}\n\n### Key Insights\n`;
      data.insights.forEach((insight: string) => {
        analysisText += `- ${insight}\n`;
      });
      
      analysisText += `\n### Recommendations\n`;
      data.recommendations.forEach((rec: any) => {
        analysisText += `- **${rec.action}**: ${rec.rationale}\n`;
      });
      
      analysisText += `\n### Psychology Audit\n${data.psychologyAudit}`;

      const aiMsg: Message = {
        id: Math.random().toString(36).substring(2, 9),
        role: "assistant",
        text: analysisText,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiMsg]);
      if (autoRead) speakText(analysisText, aiMsg.id);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async (textToSend: string) => {
    if (!textToSend.trim() || loading) return;

    // stop speaking on new user action
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsSpeaking(null);
    }

    const userMsg: Message = {
      id: Math.random().toString(36).substring(2, 9),
      role: "user",
      text: textToSend,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);
    setError(null);

    try {
      const chatPayload = [...messages, userMsg].map((m) => ({
        role: m.role,
        text: m.text,
      }));

      const res = await fetch("/api/gemini/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ messages: chatPayload }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to generate AI response.");
      }

      const responseData = await res.json();
      
      const aiMsg: Message = {
        id: Math.random().toString(36).substring(2, 9),
        role: "assistant",
        text: responseData.text,
        timestamp: new Date(),
        sources: responseData.sources || [],
        searchQueries: responseData.searchQueries || [],
      };

      setMessages((prev) => [...prev, aiMsg]);

      // If autoRead is enabled, and not in live mode (which has its own audio stream), trigger voice synthesis output
      if (autoRead && !liveMode) {
        setTimeout(() => {
          speakText(responseData.text, aiMsg.id);
        }, 150);
      }
    } catch (err: any) {
      console.log("Chat fetch error");
      setError(err.message || "An error occurred while connecting to Sera.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSend(input);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend(input);
    }
  };

  // Helper to parse and render text with basic bolding and bullet list styling
  const renderFormattedText = (rawText: string) => {
    const lines = rawText.split("\n");
    return lines.map((line, idx) => {
      const isBullet = line.trim().startsWith("- ") || line.trim().startsWith("* ");
      const displayLine = isBullet ? line.trim().substring(2) : line;

      const parts = displayLine.split(/\*\*([^*]+)\*\*/g);
      const formattedParts = parts.map((part, pidx) => {
        if (pidx % 2 === 1) {
          return <strong key={pidx} className="font-bold text-emerald-400">{part}</strong>;
        }
        return part;
      });

      if (isBullet) {
        return (
          <li key={idx} className="ml-4 list-disc text-neutral-300 mb-1.5 leading-relaxed text-sm">
            {formattedParts}
          </li>
        );
      }

      return (
        <p key={idx} className="text-neutral-300 mb-3 leading-relaxed text-sm">
          {formattedParts}
        </p>
      );
    });
  };

  return (
    <div id="gemini-chat-container" className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[720px] max-h-[80vh] relative">
      {/* Sidebar - Starter Prompts & Vocal Controls */}
      <div className="lg:col-span-1 bg-neutral-900 border border-neutral-800 rounded-2xl p-5 flex flex-col justify-between text-left">
        <div>
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-neutral-800/60">
            <Bot className="text-emerald-400" size={20} />
            <span className="font-bold text-white tracking-wide">Sera Co-pilot</span>
          </div>

          <p className="text-xs text-neutral-400 leading-relaxed mb-4">
            Sera is optimized to evaluate technical breakouts and risk/reward configurations with dynamic voice assistance.
          </p>

          <button
            onClick={toggleLiveMode}
            className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold font-mono text-[10px] tracking-wider uppercase transition-all mb-2 ${
              liveMode
                ? "bg-rose-500/20 text-rose-400 border border-rose-500/40 hover:bg-rose-500/30"
                : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 hover:bg-emerald-500/30"
            }`}
          >
            {liveMode ? (
              <>
                <PhoneOff size={14} /> End Live Session
              </>
            ) : (
              <>
                <Phone size={14} /> Start Live Voice Session
              </>
            )}
          </button>

          <button
            onClick={() => handleAnalyzeContext()}
            disabled={loading || contextLoading || portfolios.length === 0}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold font-mono text-[10px] tracking-wider uppercase transition-all mb-4 bg-amber-500/20 text-amber-400 border border-amber-500/40 hover:bg-amber-500/30 disabled:opacity-50"
          >
            <Database size={14} /> Analyze My Data
          </button>

          {/* Vocal Engine Control Center */}
          <div className="bg-neutral-950 border border-neutral-850 rounded-xl p-3 mb-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[9px] text-neutral-400 uppercase tracking-wider font-bold flex items-center gap-1">
                <Volume2 size={10} className="text-emerald-400" /> Vocal Engine
              </span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoRead}
                  onChange={(e) => {
                    setAutoRead(e.target.checked);
                    if (!e.target.checked && isSpeaking) {
                      if (typeof window !== "undefined" && window.speechSynthesis) {
                        window.speechSynthesis.cancel();
                      }
                      setIsSpeaking(null);
                    }
                  }}
                  className="sr-only peer"
                />
                <div className="w-7 h-4 bg-neutral-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-neutral-400 after:border-neutral-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-emerald-500 peer-checked:after:bg-neutral-950 peer-checked:after:border-neutral-950"></div>
                <span className="ml-1.5 text-[9px] font-mono text-neutral-400 uppercase font-bold">Auto-Read</span>
              </label>
            </div>

            {/* Voice dropdown */}
            {availableVoices.length > 0 ? (
              <div className="space-y-1">
                <label className="text-[8px] font-mono text-neutral-500 uppercase block">Select Voice</label>
                <select
                  value={selectedVoice}
                  onChange={(e) => setSelectedVoice(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-lg p-1.5 text-[10px] font-mono text-neutral-300 focus:outline-none focus:border-emerald-500/30"
                >
                  {availableVoices
                    .filter((v) => v.lang.startsWith("en") || v.lang.startsWith("es") || v.lang.startsWith("fr"))
                    .slice(0, 15)
                    .map((voice, vi) => (
                      <option key={vi} value={voice.name}>
                        {voice.name.replace("Microsoft", "").replace("Google", "").trim()} ({voice.lang})
                      </option>
                    ))}
                </select>
              </div>
            ) : (
              <p className="text-[9px] font-mono text-neutral-500 uppercase">Detecting system speech synthesis voices...</p>
            )}

            {isSpeaking && (
              <button
                onClick={() => {
                  if (typeof window !== "undefined" && window.speechSynthesis) {
                    window.speechSynthesis.cancel();
                  }
                  setIsSpeaking(null);
                }}
                className="w-full py-1 bg-rose-500/15 border border-rose-500/30 rounded text-[9px] font-mono font-bold text-rose-400 uppercase cursor-pointer hover:bg-rose-500/25 transition-all text-center"
              >
                ■ Stop Current Playback
              </button>
            )}
          </div>

          <h5 className="font-mono text-[10px] text-neutral-500 uppercase tracking-widest mb-3">Tactical Starters</h5>
          <div className="space-y-2.5">
            {STARTER_PROMPTS.map((prompt, index) => {
              const IconComponent = prompt.icon;
              return (
                <button
                  key={index}
                  onClick={() => handleSend(prompt.text)}
                  disabled={loading}
                  className="w-full text-left bg-neutral-950 hover:bg-neutral-850 border border-neutral-850 hover:border-emerald-500/30 p-3 rounded-xl transition-all cursor-pointer group disabled:opacity-50"
                >
                  <div className="flex items-center gap-2 text-xs font-bold text-neutral-300 group-hover:text-emerald-400 mb-1">
                    <IconComponent size={13} className="text-neutral-500 group-hover:text-emerald-400" />
                    {prompt.label}
                  </div>
                  <p className="text-[10px] text-neutral-500 line-clamp-2 leading-normal">
                    {prompt.text}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-neutral-800/60 flex items-center justify-between text-[10px] font-mono text-neutral-500 uppercase">
          <span>MODEL: GEMINI-3.5-FLASH</span>
          <span className="text-emerald-500/80">ONLINE</span>
        </div>
      </div>

      {/* Main Chat Interface */}
      <div className="lg:col-span-3 bg-neutral-900 border border-neutral-800 rounded-2xl flex flex-col h-full overflow-hidden">
        {/* Chat Header */}
        <div className="px-6 py-4 bg-neutral-950/40 border-b border-neutral-800/40 flex items-center justify-between">
          <div className="flex items-center gap-3 text-left">
            <div className="h-9 w-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <Sparkles size={18} className="text-emerald-400" />
            </div>
            <div>
              <h4 className="font-sans font-bold text-sm text-white">Sera AI Voice Chat</h4>
              <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                ACTIVE COPILOT FEED
              </span>
            </div>
          </div>
          <span className="font-mono text-[10px] text-neutral-500 uppercase">LATENCY: ~1.2S</span>
        </div>

        {/* Message Feed */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 min-h-0">
          {liveMode && (
            <div className="sticky top-0 z-10 mx-auto w-fit mb-4 bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 rounded-full flex items-center justify-center gap-3 backdrop-blur-md shadow-lg">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
              <span className="text-xs font-mono font-bold text-emerald-400 tracking-wider uppercase">Live Connection Active</span>
              <Radio size={14} className="text-emerald-400 animate-pulse" />
            </div>
          )}

          {messages.map((m, idx) => {
            const isAI = m.role === "assistant";
            return (
              <div
                key={idx}
                className={`flex gap-3.5 max-w-[85%] text-left ${isAI ? "" : "ml-auto flex-row-reverse"}`}
              >
                {/* Avatar Icon */}
                <div className={`h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 ${isAI ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400" : "bg-neutral-850 border border-neutral-800 text-neutral-300"}`}>
                  {isAI ? <Sparkles size={14} /> : <User size={14} />}
                </div>

                {/* Message Box */}
                <div className={`rounded-2xl px-4 py-3 border relative group/msg ${isAI ? "bg-neutral-950/20 border-neutral-850/60" : "bg-neutral-950 border-neutral-800/80"}`}>
                  <div className="prose prose-invert prose-xs max-w-none text-left">
                    {renderFormattedText(m.text)}
                  </div>

                  {/* Search Queries and Grounded Citations */}
                  {isAI && m.searchQueries && m.searchQueries.length > 0 && (
                    <div className="mt-2.5 pt-2 border-t border-neutral-800/20 flex flex-wrap items-center gap-1.5 text-[9px] font-mono text-neutral-400">
                      <span className="text-cyan-400">● Web Queries:</span>
                      {m.searchQueries.map((q, qIdx) => (
                        <span key={qIdx} className="bg-neutral-950 border border-neutral-850 text-neutral-300 px-1.5 py-0.5 rounded text-[8px]">
                          "{q}"
                        </span>
                      ))}
                    </div>
                  )}

                  {isAI && m.sources && m.sources.length > 0 && (
                    <div className="mt-2 space-y-1 text-left">
                      <span className="text-[8px] font-mono text-neutral-500 uppercase tracking-wider block font-bold">Citations / Verified Sources:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {m.sources.map((src, sIdx) => (
                          <a
                            key={sIdx}
                            href={src.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2 py-0.5 bg-cyan-500/10 border border-cyan-500/20 hover:border-cyan-400/40 rounded-md text-[9px] font-mono text-cyan-400 transition-all hover:bg-cyan-500/15"
                          >
                            <Globe size={9} />
                            <span className="max-w-[100px] truncate">{src.title}</span>
                            <ExternalLink size={7} />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-neutral-850/40">
                    <div>
                      {isAI && (
                        <button
                          type="button"
                          onClick={() => speakText(m.text, m.id)}
                          className={`flex items-center gap-1 text-[10px] font-mono transition-all px-1.5 py-0.5 rounded cursor-pointer ${isSpeaking === m.id ? "text-emerald-400 bg-emerald-500/10 font-bold" : "text-neutral-500 hover:text-neutral-300 hover:bg-neutral-950"}`}
                        >
                          {isSpeaking === m.id ? (
                            <>
                              <VolumeX size={11} className="animate-pulse" /> Stop Voice
                            </>
                          ) : (
                            <>
                              <Volume2 size={11} /> Speak Aloud
                            </>
                          )}
                        </button>
                      )}
                    </div>
                    <span className="block text-[9px] font-mono text-neutral-500">
                      {m.timestamp.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Loading bubble */}
          {loading && (
            <div className="flex gap-3.5 max-w-[85%] text-left">
              <div className="h-8 w-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0 animate-pulse">
                <Loader2 size={14} className="animate-spin" />
              </div>
              <div className="rounded-2xl px-5 py-4 bg-neutral-950/20 border border-neutral-850/60 flex items-center gap-2">
                <span className="text-xs font-mono text-neutral-400 animate-pulse uppercase tracking-wider">Sera is calculating outcomes...</span>
              </div>
            </div>
          )}

          {/* Error display */}
          {error && (
            <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-3.5 text-xs text-rose-400 text-left font-mono">
              [SERVER EXCEPTION] {error}. If you haven't done so, please make sure your Gemini API Key is configured in settings.
            </div>
          )}

                    {liveInputText && (
            <div className="flex gap-3.5 max-w-[85%] text-left ml-auto flex-row-reverse opacity-70">
              <div className="h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-neutral-850 border border-neutral-800 text-neutral-300">
                <User size={14} />
              </div>
              <div className="rounded-2xl px-4 py-3 border bg-neutral-950 border-neutral-800/80">
                <span className="text-xs font-mono text-neutral-400">{liveInputText}</span>
              </div>
            </div>
          )}

          {liveOutputText && (
            <div className="flex gap-3.5 max-w-[85%] text-left opacity-70">
              <div className="h-8 w-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0">
                <Sparkles size={14} />
              </div>
              <div className="rounded-2xl px-4 py-3 border bg-neutral-950/20 border-neutral-850/60">
                <span className="text-xs font-mono text-emerald-400">{liveOutputText}</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSubmit} className="p-4 bg-neutral-950/40 border-t border-neutral-800/40 flex flex-col gap-2">
          {/* Active vocal listening banner indicator */}
          {isListening && (
            <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-[10px] font-mono text-emerald-400 animate-pulse text-left self-start">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping mr-1" />
              Sera's ear is active... Speak your query clearly.
            </div>
          )}

          {recognitionError && (
            <div className="px-3 py-1 bg-rose-500/10 border border-rose-500/20 rounded-lg text-[10px] font-mono text-rose-400 text-left self-start">
              ⚠️ {recognitionError}
            </div>
          )}

          <div className="flex items-end gap-3">
            <div className="flex-1 bg-neutral-950 border border-neutral-850 focus-within:border-emerald-500/50 rounded-xl transition-all flex items-center px-3.5 py-1.5">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Query technical catalyst, scale entries, or analyze portfolio moats..."
                className="w-full bg-transparent text-sm text-neutral-100 placeholder-neutral-500 focus:outline-none resize-none max-h-16 py-1 font-sans text-left mr-2"
                rows={1}
              />
              <button
                type="button"
                onClick={toggleListening}
                className={`p-1.5 rounded-lg transition-all cursor-pointer flex-shrink-0 ${isListening ? "bg-rose-500/20 text-rose-400 animate-pulse border border-rose-500/40" : "text-neutral-500 hover:text-neutral-300 hover:bg-neutral-900"}`}
                title={isListening ? "Stop listening" : "Speak to type query"}
              >
                {isListening ? <MicOff size={15} /> : <Mic size={15} />}
              </button>
            </div>
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="h-10 w-10 bg-emerald-500 hover:bg-emerald-600 active:scale-[0.97] rounded-xl flex items-center justify-center text-neutral-950 transition-all disabled:opacity-50 cursor-pointer flex-shrink-0"
            >
              <Send size={15} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

