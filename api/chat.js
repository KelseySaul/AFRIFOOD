import { GoogleGenerativeAI } from "@google/generative-ai";

const africanFoodKB = {
  regions: {
    west: {
      name: "West Africa",
      staples: ["Cassava", "Yam", "Plantain", "Rice", "Millet"],
      dishes: [
        { name: "Jollof Rice", description: "One-pot rice dish with tomatoes, onions, and spices (Nigerian vs Ghanian debate is legendary)." },
        { name: "Egusi Soup", description: "Rich soup made from melon seeds, leafy greens, and meat/fish, typically eaten with fufu." },
        { name: "Suya", description: "Spicy skewered meat (usually beef or chicken) coated in kuli-kuli (peanut) spice rub." },
        { name: "Pounded Yam", description: "Smooth, stretchy dough made by pounding boiled yams, the king of swallows." }
      ]
    },
    east: {
      name: "East Africa",
      staples: ["Maize", "Teff", "Bananas", "Sorghum"],
      dishes: [
        { name: "Injera", description: "Sour, spongy flatbread made from fermented teff flour, the base of Ethiopian/Eritrean cuisine." },
        { name: "Ugali", description: "Stiff maize flour porridge, a cornerstone of Kenyan and Tanzanian meals." },
        { name: "Nyama Choma", description: "Roasted meat (most commonly goat) served with kachumbari and ugali." },
        { name: "Pilau", description: "Fragant spiced rice, heavily influenced by Swahili coastal traditions." }
      ]
    },
    north: {
      name: "North Africa",
      staples: ["Semolina", "Wheat", "Dates", "Olives"],
      dishes: [
        { name: "Couscous", description: "Steamed semolina granules, often served with vegetable or meat stews." },
        { name: "Tajine", description: "Slow-cooked stew named after the earthenware pot it's cooked in, known for sweet/savory balance." },
        { name: "Shakshuka", description: "Poached eggs in a spicy tomato and bell pepper sauce, common in Tunisia and Egypt." },
        { name: "Ful Medames", description: "Egyptian staple of cooked fava beans flavored with cumin, oil, and garlic." }
      ]
    },
    south: {
      name: "Southern Africa",
      staples: ["Maize", "Sorghum", "Game Meat"],
      dishes: [
        { name: "Chakalaka", description: "Spicy vegetable relish (onions, tomatoes, beans) served at every South African braai." },
        { name: "Bobotie", description: "Cape Dutch-influenced dish of spiced minced meat baked with an egg-based topping." },
        { name: "Bunny Chow", description: "Hollowed-out loaf of white bread filled with spicy curry, born in Durban's Indian community." },
        { name: "Pap", description: "Maize porridge, similar to Ugali, often served with 'sheba' (tomato and onion sauce)." }
      ]
    },
    central: {
      name: "Central Africa",
      staples: ["Cassava", "Plantains", "Peanuts", "Bushmeat"],
      dishes: [
        { name: "Ndole", description: "Cameroonian dish made of bitter leaves, nuts, and meat or shrimp." },
        { name: "Poulet Moambe", description: "Chicken cooked in a rich sauce made from the pericarp of oil palm nuts." },
        { name: "Chikwangue", description: "Fermented cassava dough wrapped in banana leaves and steamed, a classic 'swallow'." }
      ]
    }
  },
  ingredients: [
    { name: "Teff", description: "Ancient grain from Ethiopia, gluten-free and highly nutritious." },
    { name: "Berbere", description: "Spice blend containing chili peppers, garlic, ginger, basil, and more; essential to Ethiopian food." },
    { name: "Harissa", description: "Hot chili pepper paste with roasted red peppers, Baklouti peppers, serrano peppers, and other hot chili peppers." },
    { name: "Palm Oil", description: "Red oil extracted from the oil palm fruit, giving West and Central African stews their signature color." },
    { name: "Gari", description: "Granulated flour made from fermented, mashed, and dried cassava." }
  ],
  traditions: [
    { name: "Communal Eating", description: "Many African cultures prioritize eating from a shared plate to foster unity." },
    { name: "Hand-to-Mouth", description: "The use of the right hand to scoop 'swallow' and dip it into soups is standard practice." },
    { name: "Spice Trade", description: "Coastal regions like Zanzibar and Cape Town have deep historical ties to the global spice routes." }
  ]
};

const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { message, history } = req.body;

  if (!apiKey) {
    return res.status(500).json({ error: 'Gemini API Key missing in backend environment.' });
  }

  try {
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash",
      systemInstruction: `You are "Chakula", the AfriFood Culinary Guide. Your voice is warm, knowledgeable, and passionate about the diverse flavors of Africa.

      KNOWLEDGE BASE:
      ${JSON.stringify(africanFoodKB, null, 2)}

      CRITICAL CONSTRAINTS:
      1. ONLY discuss African food, ingredients, cooking techniques, culinary history, and restaurant culture based on the Knowledge Base and your broader training.
      2. If asked about non-African foods (e.g., Pizza, Croissants, Sushi), politely decline and steer the conversation back to an African alternative or related concept.
      3. If asked about non-food topics, briefly state that you are a culinary guide and ask what African recipe the user would like to learn about.
      4. Talk like a "human chef" – use sensory words (sizzling, fragrant, hearty, tangy), share interesting historical tidbits, and be conversational.
      5. Keep responses concise but flavorful.`
    });

    const chatHistory = history.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }],
    }));

    // Gemini API requires the first message to be from the 'user'.
    const validHistory = chatHistory[0]?.role === 'model' ? chatHistory.slice(1) : chatHistory;

    const chat = model.startChat({
      history: validHistory,
    });

    const result = await chat.sendMessage(message);
    const response = await result.response;
    const text = response.text();

    return res.status(200).json({ text });
  } catch (error) {
    console.error("Gemini API Error Detail:", error);
    return res.status(error.status || 500).json({ 
      error: error.message || 'Error processing request' 
    });
  }
}
