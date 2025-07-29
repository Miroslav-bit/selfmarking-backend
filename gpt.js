const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

async function generateReply(text) {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: "Ti si duhoviti i dobronamerni komentator objava korisnika na platformi za ocenjivanje ličnih osobina." },
        { role: "user", content: `Komentariši ovu objavu: "${text}"` }
      ],
      max_tokens: 50,
      temperature: 0.8
    });

    return response.choices[0].message.content.trim();
  } catch (error) {
    console.error("GPT greška:", error.message);
    return null;
  }
}

module.exports = generateReply;
