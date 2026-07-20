import React, { useState, useEffect } from "react";
import { Users, Search, Plus, Mail, Phone, MoreVertical, Star, Shield, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface Contact {
  resourceName: string;
  names?: { displayName: string }[];
  emailAddresses?: { value: string }[];
  phoneNumbers?: { value: string }[];
  photos?: { url: string }[];
}

export default function ContactsIntegration({ accessToken }: { accessToken?: string | null }) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchContacts = async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      const response = await fetch(
        "https://people.googleapis.com/v1/people/me/connections?personFields=names,emailAddresses,phoneNumbers,photos&pageSize=100",
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
      if (!response.ok) throw new Error("Failed to fetch contacts");
      const data = await response.json();
      setContacts(data.connections || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (accessToken) fetchContacts();
  }, [accessToken]);

  const filteredContacts = contacts.filter((c) =>
    c.names?.[0]?.displayName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!accessToken) {
    return (
      <div className="bg-neutral-900 border border-neutral-800 p-12 rounded-3xl text-center">
        <Users className="mx-auto text-neutral-800 mb-4" size={48} />
        <h3 className="text-xl font-bold text-white mb-2">Connect Trading CRM</h3>
        <p className="text-neutral-500 mb-6 max-w-sm mx-auto text-sm">
          Sync your Google Contacts to manage investors, group members, and trading partners.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-500/10 rounded-lg">
            <Users className="text-blue-400" size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white tracking-tight">Trader Network</h2>
            <p className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest">People API Synchronization</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchContacts}
            disabled={loading}
            className="p-2 bg-neutral-900 border border-neutral-800 text-neutral-400 rounded-xl hover:border-neutral-700 transition-all"
          >
            <RefreshCw className={loading ? "animate-spin" : ""} size={18} />
          </button>
          <button className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-xl font-bold text-sm transition-all shadow-lg shadow-blue-500/20">
            <Plus size={18} /> New Partner
          </button>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500" size={18} />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search partners, investors, or contacts..."
          className="w-full bg-neutral-900 border border-neutral-800 rounded-2xl pl-12 pr-4 py-3 text-white focus:outline-none focus:border-blue-500/50 transition-all"
        />
      </div>

      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-neutral-950 border-b border-neutral-800">
            <tr>
              <th className="px-6 py-4 text-[10px] font-mono text-neutral-500 uppercase tracking-widest">Name</th>
              <th className="px-6 py-4 text-[10px] font-mono text-neutral-500 uppercase tracking-widest">Email</th>
              <th className="px-6 py-4 text-[10px] font-mono text-neutral-500 uppercase tracking-widest">Phone</th>
              <th className="px-6 py-4 text-[10px] font-mono text-neutral-500 uppercase tracking-widest text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-800/50">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td colSpan={4} className="px-6 py-8">
                    <div className="h-4 bg-neutral-800 rounded w-full"></div>
                  </td>
                </tr>
              ))
            ) : filteredContacts.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-neutral-500 text-sm">
                  No contacts found. Try refreshing or expanding your search.
                </td>
              </tr>
            ) : (
              filteredContacts.map((contact, i) => (
                <tr key={i} className="hover:bg-neutral-850 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 bg-neutral-800 rounded-full overflow-hidden border border-neutral-700">
                        {contact.photos?.[0]?.url ? (
                          <img src={contact.photos[0].url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center font-bold text-neutral-500">
                            {contact.names?.[0]?.displayName[0]}
                          </div>
                        )}
                      </div>
                      <p className="font-bold text-white">{contact.names?.[0]?.displayName || "Unknown"}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-neutral-400">
                    {contact.emailAddresses?.[0]?.value || "---"}
                  </td>
                  <td className="px-6 py-4 text-sm text-neutral-400">
                    {contact.phoneNumbers?.[0]?.value || "---"}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button className="p-2 text-neutral-600 hover:text-blue-400 transition-colors">
                        <Mail size={16} />
                      </button>
                      <button className="p-2 text-neutral-600 hover:text-blue-400 transition-colors">
                        <MoreVertical size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
