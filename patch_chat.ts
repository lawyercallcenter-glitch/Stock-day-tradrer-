import fs from 'fs';
let content = fs.readFileSync('src/components/GeminiChat.tsx', 'utf8');

content = content.replace(
  'const [liveMode, setLiveMode] = useState(false);',
  'const [liveMode, setLiveMode] = useState(false);\n  const [liveInputText, setLiveInputText] = useState("");\n  const [liveOutputText, setLiveOutputText] = useState("");'
);

content = content.replace(
  '        if (msg.interrupted) {\n          nextStartTimeRef.current = outputAudioCtx.currentTime;\n        }',
  `        if (msg.interrupted) {\n          nextStartTimeRef.current = outputAudioCtx.currentTime;\n        }\n        if (msg.inputTranscription) {\n          setLiveInputText(msg.inputTranscription.text || "");\n          if (msg.inputTranscription.finished) {\n            setMessages(prev => [...prev, { id: Date.now().toString(), role: "user", text: msg.inputTranscription.text || "", timestamp: new Date() }]);\n            setLiveInputText("");\n          }\n        }\n        if (msg.outputTranscription) {\n          setLiveOutputText(prevText => {\n            const newText = prevText + (msg.outputTranscription.text || "");\n            if (msg.outputTranscription.finished) {\n              setMessages(prev => [...prev, { id: Date.now().toString(), role: "assistant", text: newText, timestamp: new Date() }]);\n              return "";\n            }\n            return newText;\n          });\n        }`
);

fs.writeFileSync('src/components/GeminiChat.tsx', content);
