const textToSpeech = require('@google-cloud/text-to-speech');
const fs = require('fs');

const client = new textToSpeech.TextToSpeechClient();

async function synthesizeToFile(text, outPath, opts = {}) {
  const request = {
    input: { text: text },
    voice: {
      languageCode: opts.languageCode || 'en-US',
      name: opts.voiceName || 'en-US-Wavenet-F',
      ssmlGender: opts.ssmlGender || 'FEMALE'
    },
    audioConfig: {
      audioEncoding: 'MP3'
    }
  };

  const [response] = await client.synthesizeSpeech(request);
  fs.writeFileSync(outPath, response.audioContent, 'binary');
}

module.exports = { synthesizeToFile };