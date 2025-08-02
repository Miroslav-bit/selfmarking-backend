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
    console.log("GPT RAW:", result);

    let parsed;
    try {
      parsed = JSON.parse(result);
    } catch (e) {
      const extractedScore = parseInt(result.match(/([+-]?\d{1,4})/)?.[1]) || 0;
      return {
        comment: result,
        score: extractedScore
      };
    }

    return parsed;

  } catch (error) {
    console.error("GPT greška:", error.message);
    return {
      comment: "Nije moguće generisati ocenu.",
      score: 0
    };
  }
}

async function generateQuestion(subCategory, panelOwnerFullName) {
  try {
    const scaleFilePath = path.join(__dirname, 'scales', `${subCategory.toLowerCase()}.js`);

    if (!fs.existsSync(scaleFilePath)) {
      return {
        question: `Nije definisana skala za kategoriju: ${subCategory}.`,
        answers: [
          { text: "Nije moguće formirati odgovore", points: 0 }
        ]
      };
    }

    let scalePrompt = require(scaleFilePath);
    scalePrompt = scalePrompt.replace('{{IME}}', panelOwnerFullName);

    const prompt = `
Ti si veštačka inteligencija koja postavlja jedno test-pitanje iz oblasti "${subCategory}" osobi po imenu ${panelOwnerFullName}.

Pitanje mora biti realna ili hipotetička situacija na osnovu koje se može proceniti nivo osobine "${subCategory}".

Za pitanje ponudi TAČNO četiri različita odgovora, od kojih svaki donosi određeni broj bodova (od 0 do 100).

Obavezno odgovori u ovom JSON formatu, bez ikakvog dodatnog teksta:

{
  "question": "Ovde ide tekst pitanja",
  "answers": [
    { "text": "Odgovor A", "points": 100 },
    { "text": "Odgovor B", "points": 70 },
    { "text": "Odgovor C", "points": 40 },
    { "text": "Odgovor D", "points": 0 }
  ]
}
    `.trim();

    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: prompt
        }
      ],
      temperature: 0.9,
      max_tokens: 400
    });

    const result = response.choices[0].message.content.trim();
    console.log("GPT QUESTION RAW:", result);

    try {
      const parsed = JSON.parse(result);
      return parsed;
    } catch (e) {
      return {
        question: "Greška u obradi GPT odgovora.",
        answers: [
          { text: "Nepoznat odgovor", points: 0 }
        ]
      };
    }

  } catch (error) {
    console.error("GPT greška u generateQuestion:", error.message);
    return {
      question: "Nije moguće generisati pitanje.",
      answers: [
        { text: "Nepoznat odgovor", points: 0 }
      ]
    };
  }
}

module.exports = {
  generateReply,
  generateQuestion
};
