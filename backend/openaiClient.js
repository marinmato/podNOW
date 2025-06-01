const OpenAI = require("openai");
require("dotenv").config({ path: require("path").join(__dirname, "../.env") });

const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) throw new Error("OPENAI_API_KEY missing from .env");

const openai = new OpenAI({ apiKey });

async function generateDialogue(topic, minutes = 8) {
  const prompt = `Create a ${minutes}-minute podcast conversation between two hosts about "${topic}".

Format requirements:
- Start each line with exactly "A:" or "B:" 
- Host A is male, Host B is female
- Make it conversational and engaging
- Each speaker should have roughly equal speaking time

Host A starts off with a greeting, then mentions the topic. Then, Host B 
acknowledges the topic as well. 

I want you to spent very little time on the broader topic. Then, pick an example
or even relating the topic to talk about. 

For example, if the user picks sports, you can talk about a relevant 
sporting event, like the NBA conference finals and finals, UCL final, etc. 

Now create the full conversation:`;

  const resp = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: "You are a creative podcast dialogue writer. Always format each line with 'A:' or 'B:' at the start." },
      { role: "user", content: prompt }
    ],
    temperature: 0.4,
    max_tokens: 3500,
  });

  return resp.choices[0].message.content.trim();
}

module.exports = { generateDialogue };