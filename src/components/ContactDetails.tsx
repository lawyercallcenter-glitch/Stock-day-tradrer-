import React, { useState, useEffect } from "react";
import { ArrowLeft, Mail, Phone, History, TrendingUp, TrendingDown, Minus, Clock, Share2, MessageSquare } from "lucide-react";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { db, auth, handleFirestoreError, OperationType } from "../lib/firebase";
import { motion, AnimatePresence } from "motion/react";

interface Contact {
  resourceName: string;
  names?: { displayName: string }[];
  emailAddresses?: { value: string }[];
  phoneNumbers?: { value: string }[];
  photos?: { url: string }[];
}

interface Recommendation {
  id: string;
  ticker: string;
  contactResourceName: string;
  sharedAt: string;
  message: string;
  type?: "buy" | "sell" | "hold";
}

interface ContactDetailsProps {
  contact: Contact;
  onBack: () => void;
  accessToken?: string | null;
}

export default function ContactDetails({ contact, onBack, accessToken }: ContactDetailsProps) {
  const [history, setHistory] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = async () => {
    if (!auth.currentUser) return;
    setLoading(true);
    const path = `users/${auth.currentUser.uid}/recommendations`;
    try {
      const q = query(
        collection(db, path),
        where("contactResourceName", "==", contact.resourceName),
        orderBy("sharedAt", "desc")
      );
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Recommendation));
      setHistory(data);
    } catch (err: any) {
      console.error("Error fetching recommendation history:", err);
      // Fallback for missing index or other firestore errors
      setError("Unable to load recommendation history. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [contact.resourceName]);

  const name = contact.names?.[0]?.displayName || "Unknown Contact";
  const email = contact.emailAddresses?.[0]?.value;
  const phone = contact.phoneNumbers?.[0]?.value;
  const photo = contact.photos?.[0]?.url;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button 
          onClick={onBack}
          className="p-2 bg-neutral-900 border border-neutral-800 text-neutral-400 rounded-xl hover:text-white transition-all"
        >
          <ArrowLeft size={20} />
        </button>
        <h2 className="text-2xl font-bold text-white">Contact Details</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-8 text-center space-y-4">
            <div className="h-24 w-24 bg-neutral-800 rounded-full mx-auto overflow-hidden border-2 border-blue-500/20">
              {photo ? (
                <img src={photo} alt={name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-neutral-500">
                  {name[0]}
                </div>
              )}
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">{name}</h3>
              <p className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest mt-1">Trading Partner</p>
            </div>
            
            <div className="pt-4 space-y-3 text-left">
              {email && (
                <div className="flex items-center gap-3 text-sm text-neutral-400 bg-neutral-950 p-3 rounded-xl border border-neutral-850">
                  <Mail size={16} className="text-blue-400" />
                  <span className="truncate">{email}</span>
                </div>
              )}
              {phone && (
                <div className="flex items-center gap-3 text-sm text-neutral-400 bg-neutral-950 p-3 rounded-xl border border-neutral-850">
                  <Phone size={16} className="text-blue-400" />
                  <span>{phone}</span>
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-4">
              <button className="flex-1 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-bold text-xs transition-all shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2">
                <Share2 size={14} /> Share Signal
              </button>
              <button className="p-3 bg-neutral-800 hover:bg-neutral-700 text-white rounded-xl transition-all">
                <MessageSquare size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* History Section */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <History className="text-blue-400" size={20} />
                <h3 className="font-bold text-white uppercase text-xs tracking-widest">Recommendation History</h3>
              </div>
              <div className="text-[10px] font-mono text-neutral-500 uppercase">
                {history.length} Shared Items
              </div>
            </div>

            <div className="space-y-4">
              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-20 bg-neutral-850 rounded-2xl animate-pulse"></div>
                  ))}
                </div>
              ) : history.length === 0 ? (
                <div className="py-12 text-center space-y-3">
                  <Clock className="mx-auto text-neutral-800" size={40} />
                  <p className="text-neutral-500 text-sm">No shared recommendations found for this contact.</p>
                </div>
              ) : (
                history.map((rec) => (
                  <div key={rec.id} className="bg-neutral-950 border border-neutral-850 p-4 rounded-2xl hover:border-blue-500/30 transition-all group">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${
                          rec.type === 'buy' ? 'bg-emerald-500/10 text-emerald-400' : 
                          rec.type === 'sell' ? 'bg-rose-500/10 text-rose-400' : 
                          'bg-blue-500/10 text-blue-400'
                        }`}>
                          {rec.type === 'buy' ? <TrendingUp size={16} /> : 
                           rec.type === 'sell' ? <TrendingDown size={16} /> : 
                           <Minus size={16} />}
                        </div>
                        <div>
                          <p className="font-bold text-white tracking-tight">{rec.ticker}</p>
                          <p className="text-[10px] text-neutral-600 uppercase font-mono">
                            {new Date(rec.sharedAt).toLocaleDateString()} at {new Date(rec.sharedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                      <div className={`text-[10px] font-bold uppercase px-2 py-1 rounded-md ${
                        rec.type === 'buy' ? 'text-emerald-400' : 
                        rec.type === 'sell' ? 'text-rose-400' : 
                        'text-blue-400'
                      }`}>
                        {rec.type || 'Shared'}
                      </div>
                    </div>
                    <p className="text-sm text-neutral-400 leading-relaxed italic border-l-2 border-neutral-800 pl-4 mt-3">
                      "{rec.message}"
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
