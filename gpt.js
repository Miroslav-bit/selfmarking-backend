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

Odgovori isključivo u JSON formatu.
Nemoj dodavati dodatni tekst, pojašnjenja, uvode ni objašnjenja.
Primer:
{ "comment": "Bravo, to je prevazilaženje fobije!", "score": 200 }
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

    let parsed;
    try {
      parsed = JSON.parse(result);
    } catch (e) {
      // Pokušaj da izvučeš broj iz teksta ako JSON parsiranje nije uspelo
      const extractedScore = parseInt(result.match(/([+-]?\d{1,4})/)?.[1]) || 0;
      return {
        comment: result,
        score: extractedScore
      };
    }
    return parsed;
}

module.exports = generateReply;
