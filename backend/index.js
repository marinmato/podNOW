require("dotenv").config();
const path = require("path");
const express = require("express");
const sanitizeTopic = require("./sanitizeTopic");
const { synthesizeToFile } = require("./ttsClient");
const { generateDialogue } = require("./openaiClient");
const fs = require("fs");
const app = express();
app.use(express.json());
const PORT = process.env.PORT || 5000;

// ensure tmp folder exists
fs.mkdirSync(path.join(__dirname, "../tmp"), { recursive: true });

// health check
app.get("/healthz", (_, res) => res.send("ok"));

// GET /test-tts  → generates tmp/test.mp3 from first line of transcript.txt
app.get("/test-tts", async (req, res) => {
  try {
    const tPath = path.join(__dirname, "../tmp/transcript.txt");
    const lines = fs.readFileSync(tPath, "utf8")
                    .split(/\r?\n/)
                    .filter(l => l.trim());
    if (!lines.length) throw new Error("transcript.txt is empty");
    const firstLine = lines[0].replace(/^[AB]:\s*/, "");
    const outPath = path.join(__dirname, "../tmp/test.mp3");
    await synthesizeToFile(firstLine, outPath);
    return res.json({ audioUrl: "/tmp/test.mp3" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "TTS test failed" });
  }
});

app.post("/generate", async (req, res) => {
  const raw = req.body.topic || "";
  const clean = sanitizeTopic(raw);
  console.log("raw:", raw, "→ clean:", clean);

  // 1) get transcript from OpenAI
  let transcript;
  try {
    transcript = await generateDialogue(clean);
    console.log("Generated transcript:", transcript);
  } catch (err) {
    console.error("OpenAI error:", err);
    return res.status(500).json({ error: "OpenAI failed" });
  }

  const fs   = require("fs");
  const path = require("path");
  const { execSync } = require("child_process");
  const tmpDir = path.join(__dirname, "../tmp");
  fs.mkdirSync(tmpDir, { recursive: true });

  const transcriptPath = path.join(tmpDir, "transcript.txt");
  fs.writeFileSync(transcriptPath, transcript, "utf8");

  // 2) split transcript into chunks
  const lines = transcript.split(/\r?\n/).filter(l => l.trim());
  const chunkFiles = [];
  console.log("Processing", lines.length, "lines");

  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/^([AB]):\s*(.+)$/);
    if (!m) {
      console.log("Skipping line", i, ":", lines[i]);
      continue;
    }
    const speaker = m[1];
    const text    = m[2];

    const voiceOpts =
      speaker === "A"
        ? { voiceName: "en-US-Wavenet-F", ssmlGender: "FEMALE" }
        : { voiceName: "en-US-Wavenet-D", ssmlGender: "MALE" };

    const outPath = path.join(tmpDir, `chunk_${i}_${speaker}.mp3`);
    try {
      await synthesizeToFile(text, outPath, voiceOpts);
      chunkFiles.push(outPath);
    } catch (err) {
      console.error("TTS failed on chunk", i, err);
      return res.status(500).json({ error: "TTS synthesis failed" });
    }
  }

  // 3) build concat list for ffmpeg
  const concatList = chunkFiles.map(p => `file '${p.replace(/'/g, "'\\''")}'`).join("\n");
  const listPath = path.join(tmpDir, "concat_list.txt");
  fs.writeFileSync(listPath, concatList, "utf8");

  // 4) run ffmpeg to stitch
  const finalName = `podcast_${Date.now()}.mp3`;
  const finalPath = path.join(tmpDir, finalName);
  try {
    execSync(`ffmpeg -y -f concat -safe 0 -i "${listPath}" -c copy "${finalPath}"`, {
      stdio: "ignore",
    });
  } catch (err) {
    console.error("ffmpeg error", err);
    return res.status(500).json({ error: "Audio concatenation failed" });
  }

  // 5) send url back
  res.json({ audioUrl: `/tmp/${finalName}` });
});

// static folders (to be filled later)
app.use("/", express.static(path.join(__dirname, "../frontend")));
app.use("/tmp", express.static(path.join(__dirname, "../tmp")));

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});