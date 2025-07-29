const { Configuration, OpenAIApi } = require("openai");

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY
});

const openai = new OpenAIApi(configuration);

async function generateReply(text) {
  try {
    const response = await openai.createChatCompletion({
      model: "gpt-4",
      messages: [
        { role: "system", content: "Ti si duhoviti i dobronamerni komentator objava korisnika na platformi za ocenjivanje ličnih osobina." },
        { role: "user", content: `Komentariši ovu objavu: "${text}"` }
      ],
      max_tokens: 50,
      temperature: 0.8
    });
    return response.data.choices[0].message.content.trim();
  } catch (error) {
    console.error("GPT greška:", error.response?.data || error.message);
    return null;
  }
}

module.exports = generateReply;
