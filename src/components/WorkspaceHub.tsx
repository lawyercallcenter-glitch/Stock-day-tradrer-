import React, { useState, useEffect } from "react";
import { Mail, Video, FileText, Send, CheckCircle2, ChevronRight, MessageSquare, Presentation } from "lucide-react";
import { sendEmail, createMeetSpace, getFormResponses, listGoogleForms, createChatSpace, sendChatMessage, createPresentation } from "../lib/workspace";

export default function WorkspaceHub({ accessToken }: { accessToken: string | null }) {
  const [emailTo, setEmailTo] = useState("");
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailSuccess, setEmailSuccess] = useState(false);

  const [creatingMeet, setCreatingMeet] = useState(false);
  const [meetLink, setMeetLink] = useState<string | null>(null);

  const [forms, setForms] = useState<any[]>([]);
  const [loadingForms, setLoadingForms] = useState(false);
  const [selectedFormId, setSelectedFormId] = useState("");
  const [formResponses, setFormResponses] = useState<any[]>([]);
  const [loadingResponses, setLoadingResponses] = useState(false);

  const [chatSpaceName, setChatSpaceName] = useState("");
  const [chatMessage, setChatMessage] = useState("");
  const [creatingChatSpace, setCreatingChatSpace] = useState(false);
  const [createdChatSpace, setCreatedChatSpace] = useState<any>(null);

  const [presentationTitle, setPresentationTitle] = useState("");
  const [creatingPresentation, setCreatingPresentation] = useState(false);
  const [createdPresentation, setCreatedPresentation] = useState<any>(null);

  useEffect(() => {
    if (accessToken) {
      fetchForms();
    }
  }, [accessToken]);

  const fetchForms = async () => {
    if (!accessToken) return;
    setLoadingForms(true);
    try {
      const files = await listGoogleForms(accessToken);
      setForms(files);
      if (files.length > 0) {
        setSelectedFormId(files[0].id);
      }
    } catch (err) {
      console.log("Error fetching forms", err);
    } finally {
      setLoadingForms(false);
    }
  };

  const handleFetchResponses = async () => {
    if (!accessToken || !selectedFormId) return;
    setLoadingResponses(true);
    try {
      const res = await getFormResponses(accessToken, selectedFormId);
      setFormResponses(res.responses || []);
    } catch (err) {
      console.log("Error fetching responses", err);
    } finally {
      setLoadingResponses(false);
    }
  };

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken || !emailTo || !emailSubject || !emailBody) return;
    
    if (!window.confirm(`Send email to ${emailTo}?`)) return;

    setSendingEmail(true);
    setEmailSuccess(false);
    try {
      await sendEmail(accessToken, emailTo, emailSubject, emailBody);
      setEmailSuccess(true);
      setEmailTo("");
      setEmailSubject("");
      setEmailBody("");
      setTimeout(() => setEmailSuccess(false), 3000);
    } catch (err) {
      alert("Failed to send email");
    } finally {
      setSendingEmail(false);
    }
  };

  const handleCreateMeet = async () => {
    if (!accessToken) return;
    setCreatingMeet(true);
    try {
      const res = await createMeetSpace(accessToken);
      if (res?.meetingUri) {
        setMeetLink(res.meetingUri);
      }
    } catch (err) {
      alert("Failed to create Meet space");
    } finally {
      setCreatingMeet(false);
    }
  };

  const handleCreateChatSpace = async () => {
    if (!accessToken || !chatSpaceName) return;
    setCreatingChatSpace(true);
    try {
      const res = await createChatSpace(accessToken, chatSpaceName);
      setCreatedChatSpace(res);
    } catch (err) {
      alert("Failed to create chat space");
    } finally {
      setCreatingChatSpace(false);
    }
  };

  const handleSendChatMessage = async () => {
    if (!accessToken || !createdChatSpace || !chatMessage) return;
    try {
      await sendChatMessage(accessToken, createdChatSpace.name, chatMessage);
      setChatMessage("");
      alert("Message sent!");
    } catch (err) {
      alert("Failed to send message");
    }
  };

  const handleCreatePresentation = async () => {
    if (!accessToken || !presentationTitle) return;
    setCreatingPresentation(true);
    try {
      const res = await createPresentation(accessToken, presentationTitle);
      setCreatedPresentation(res);
    } catch (err) {
      alert("Failed to create presentation");
    } finally {
      setCreatingPresentation(false);
    }
  };

  if (!accessToken) {
    return (
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-8 text-center mt-6">
        <h3 className="text-xl font-bold text-white mb-2 font-sans tracking-tight">Workspace Hub</h3>
        <p className="text-sm text-neutral-400 mb-6 font-mono">Sign in with Google and grant Workspace permissions to access this feature.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 mt-6 animate-fadeIn">
      {/* Gmail Section */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-4 pb-4 border-b border-neutral-800/50">
          <Mail className="text-emerald-400" size={18} />
          <h3 className="font-sans font-bold text-white tracking-wider uppercase text-sm">Client Outreach (Gmail)</h3>
        </div>
        
        <form onSubmit={handleSendEmail} className="space-y-3">
          <input
            type="email"
            required
            placeholder="Client Email"
            value={emailTo}
            onChange={(e) => setEmailTo(e.target.value)}
            className="w-full bg-black/40 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500/50 transition-colors font-mono"
          />
          <input
            type="text"
            required
            placeholder="Subject"
            value={emailSubject}
            onChange={(e) => setEmailSubject(e.target.value)}
            className="w-full bg-black/40 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500/50 transition-colors font-mono"
          />
          <textarea
            required
            placeholder="Message body..."
            rows={4}
            value={emailBody}
            onChange={(e) => setEmailBody(e.target.value)}
            className="w-full bg-black/40 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500/50 transition-colors font-mono resize-none"
          />
          <button
            type="submit"
            disabled={sendingEmail}
            className="w-full flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold py-3 rounded-xl transition-all disabled:opacity-50 text-sm tracking-wide"
          >
            {sendingEmail ? "Sending..." : (emailSuccess ? "Sent Successfully!" : "Send Client Update")}
            {emailSuccess ? <CheckCircle2 size={16} /> : <Send size={16} />}
          </button>
        </form>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Google Meet Section */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4 pb-4 border-b border-neutral-800/50">
            <Video className="text-emerald-400" size={18} />
            <h3 className="font-sans font-bold text-white tracking-wider uppercase text-sm">Strategy Meetings</h3>
          </div>
          <p className="text-xs text-neutral-400 mb-4 font-mono leading-relaxed">Instantly generate a Google Meet link for a 1-on-1 strategy sync.</p>
          <button
            onClick={handleCreateMeet}
            disabled={creatingMeet}
            className="w-full flex items-center justify-center gap-2 bg-neutral-950 hover:bg-black border border-neutral-800 hover:border-emerald-500/50 text-white font-bold py-3 rounded-xl transition-all text-sm"
          >
            {creatingMeet ? "Generating..." : "Create New Meeting Space"}
            <Video size={16} className={creatingMeet ? "animate-pulse" : ""} />
          </button>
          
          {meetLink && (
            <div className="mt-4 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-center">
              <p className="text-[10px] text-emerald-400 font-mono font-bold uppercase tracking-wider mb-1">Meeting Active</p>
              <a href={meetLink} target="_blank" rel="noreferrer" className="text-sm font-sans font-bold text-white hover:underline">{meetLink}</a>
            </div>
          )}
        </div>

        {/* Google Chat Section */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4 pb-4 border-b border-neutral-800/50">
            <MessageSquare className="text-emerald-400" size={18} />
            <h3 className="font-sans font-bold text-white tracking-wider uppercase text-sm">Team Chat</h3>
          </div>
          {!createdChatSpace ? (
            <div className="space-y-3">
              <input type="text" placeholder="Space Name" value={chatSpaceName} onChange={(e) => setChatSpaceName(e.target.value)} className="w-full bg-black/40 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500/50 transition-colors font-mono" />
              <button onClick={handleCreateChatSpace} disabled={creatingChatSpace} className="w-full flex items-center justify-center gap-2 bg-neutral-950 hover:bg-black border border-neutral-800 hover:border-emerald-500/50 text-white font-bold py-3 rounded-xl transition-all text-sm">
                {creatingChatSpace ? "Creating..." : "Create Space"}
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-xs text-neutral-400">Space created: {createdChatSpace.name}</p>
              <input type="text" placeholder="Message..." value={chatMessage} onChange={(e) => setChatMessage(e.target.value)} className="w-full bg-black/40 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500/50 transition-colors font-mono" />
              <button onClick={handleSendChatMessage} className="w-full flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold py-3 rounded-xl transition-all text-sm">
                Send Message <Send size={16} />
              </button>
            </div>
          )}
        </div>

        {/* Google Slides Section */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4 pb-4 border-b border-neutral-800/50">
            <Presentation className="text-emerald-400" size={18} />
            <h3 className="font-sans font-bold text-white tracking-wider uppercase text-sm">Presentations</h3>
          </div>
          {!createdPresentation ? (
            <div className="space-y-3">
              <input type="text" placeholder="Presentation Title" value={presentationTitle} onChange={(e) => setPresentationTitle(e.target.value)} className="w-full bg-black/40 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500/50 transition-colors font-mono" />
              <button onClick={handleCreatePresentation} disabled={creatingPresentation} className="w-full flex items-center justify-center gap-2 bg-neutral-950 hover:bg-black border border-neutral-800 hover:border-emerald-500/50 text-white font-bold py-3 rounded-xl transition-all text-sm">
                {creatingPresentation ? "Creating..." : "Create Presentation"}
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-xs text-neutral-400">Presentation created!</p>
              <a href={createdPresentation.presentationUrl} target="_blank" rel="noreferrer" className="block w-full text-center bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold py-3 rounded-xl transition-all text-sm">Open Presentation</a>
            </div>
          )}
        </div>

        {/* Google Forms Section */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 flex flex-col">
          <div className="flex items-center gap-2 mb-4 pb-4 border-b border-neutral-800/50">
            <FileText className="text-emerald-400" size={18} />
            <h3 className="font-sans font-bold text-white tracking-wider uppercase text-sm">Client Intake (Forms)</h3>
          </div>
          
          {loadingForms ? (
            <p className="text-xs text-neutral-500 font-mono animate-pulse">Scanning Drive for forms...</p>
          ) : forms.length === 0 ? (
            <p className="text-xs text-neutral-500 font-mono">No forms found in your Google Drive.</p>
          ) : (
            <div className="space-y-3 flex-1">
              <select
                value={selectedFormId}
                onChange={(e) => setSelectedFormId(e.target.value)}
                className="w-full bg-black/40 border border-neutral-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500/50 transition-colors font-mono"
              >
                {forms.map(f => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
              </select>
              
              <button
                onClick={handleFetchResponses}
                disabled={loadingResponses || !selectedFormId}
                className="w-full flex items-center justify-center gap-2 bg-neutral-950 hover:bg-black border border-neutral-800 hover:border-emerald-500/50 text-white font-bold py-2.5 rounded-xl transition-all text-xs uppercase tracking-wider"
              >
                {loadingResponses ? "Syncing..." : "Sync Responses"}
                <ChevronRight size={14} />
              </button>
            </div>
          )}

          {formResponses.length > 0 && (
            <div className="mt-4 pt-4 border-t border-neutral-800/50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] text-emerald-400 font-mono font-bold uppercase tracking-wider">Latest Responses</span>
                <span className="bg-neutral-800 text-neutral-300 text-[9px] font-bold px-1.5 py-0.5 rounded">{formResponses.length} total</span>
              </div>
              <div className="max-h-[120px] overflow-y-auto pr-1 space-y-2">
                {formResponses.slice(-3).reverse().map((r, i) => (
                  <div key={i} className="bg-black/40 border border-neutral-850 p-2.5 rounded-lg">
                    <p className="text-[9px] text-neutral-500 font-mono mb-1">{new Date(r.lastSubmittedTime).toLocaleString()}</p>
                    <p className="text-xs text-neutral-300 font-sans truncate">Response ID: {r.responseId}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
