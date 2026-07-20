import fs from 'fs';
let content = fs.readFileSync('src/components/GeminiChat.tsx', 'utf8');

const UI = `          {liveInputText && (
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

          <div ref={messagesEndRef} />`;

content = content.replace('<div ref={messagesEndRef} />', UI);
fs.writeFileSync('src/components/GeminiChat.tsx', content);
