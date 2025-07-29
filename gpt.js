const OpenAI = require('openai');
const fs = require('fs');
const path = require('path');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

async function generateReply(text, subCategory, panelOwnerFullName) {
  try {
    const scaleFilePath = path.join(__dirname, 'scales', `${subCategory.toLowerCase()}.js`);

    if (!fs.existsSync(scaleFilePath)) {
      return {
        comment: `Ne postoji definisana skala za kategoriju: ${subCategory}.`,
        score: 0
      };
    }

    let scalePrompt = require(scaleFilePath);
    scalePrompt = scalePrompt.replace('{{IME}}', panelOwnerFullName);

    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: `
Ti si veštačka inteligencija koja ocenjuje kategoriju "${subCategory}" za osobu po imenu ${panelOwnerFullName}.

Koristi sledeću skalu ocenjivanja:

${scalePrompt}

Odgovor mora biti validan JSON u obliku:
{ "comment": "tekst komentara", "score": broj bodova }
          `.trim()
        },
        {
          role: "user",
          content: `Proceni sledeću objavu: "${text}"`
        }
      ],
      temperature: 0.7,
      max_tokens: 200
    });

    const result = response.choices[0].message.content.trim();
    return JSON.parse(result);
  } catch (error) {
    console.error("GPT greška:", error.message);
    return {
      comment: "Nije moguće generisati ocenu.",
      score: 0
    };
  }
}

module.exports = generateReply;