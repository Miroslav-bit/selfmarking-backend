const { Configuration, OpenAIApi } = require("openai");
const configuration = new Configuration({ apiKey: process.env.OPENAI_API_KEY });
const openai = new OpenAIApi(configuration);

async function generateReply(text) {
  const response = await openai.createChatCompletion({
    model: "gpt-4",
    messages: [{ role: "user", content: `Komentariši sledeću objavu: "${text}"` }],
    max_tokens: 50
  });
  return response.data.choices[0].message.content.trim();
}

module.exports = generateReply;
