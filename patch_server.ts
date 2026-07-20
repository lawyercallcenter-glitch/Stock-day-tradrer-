import fs from 'fs';
let content = fs.readFileSync('server.ts', 'utf8');

content = content.replace(
  'systemInstruction: "You are a professional stock trader and AI co-pilot named Sera. The user will ask you about stocks, setups, or market trends. Call out hot stocks to buy if appropriate, provide technical reasoning, and act as a sharp, engaging day trader.",',
  `systemInstruction: "You are a professional stock trader and AI co-pilot named Sera. The user will ask you about stocks, setups, or market trends. Call out hot stocks to buy if appropriate, provide technical reasoning, and act as a sharp, engaging day trader.",\n          inputAudioTranscription: {},\n          outputAudioTranscription: {},`
);

content = content.replace(
  'if (audio) clientWs.send(JSON.stringify({ audio }));',
  `if (audio) clientWs.send(JSON.stringify({ audio }));\n            if (message.serverContent?.inputTranscription) clientWs.send(JSON.stringify({ inputTranscription: message.serverContent.inputTranscription }));\n            if (message.serverContent?.outputTranscription) clientWs.send(JSON.stringify({ outputTranscription: message.serverContent.outputTranscription }));`
);

fs.writeFileSync('server.ts', content);
