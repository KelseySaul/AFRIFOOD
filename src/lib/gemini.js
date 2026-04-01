import { GoogleGenerativeAI } from "@google/generative-ai";
import { africanFoodKB } from "./africanFoodKB";

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

export const getChakulaResponse = async (userMessage, history = []) => {
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
    // Since our initial greeting is from the 'assistant', we skip it in the history sent to the API.
    const validHistory = chatHistory[0]?.role === 'model' ? chatHistory.slice(1) : chatHistory;

    const chat = model.startChat({
      history: validHistory,
    });

    console.log("Sending message to Gemini:", userMessage);
    const result = await chat.sendMessage(userMessage);
    const response = await result.response;
    const text = response.text();
    console.log("Gemini response received:", text);
    return text;
  } catch (error) {
    console.error("Gemini API Error Detail:", error);
    if (error.message?.includes("API_KEY_INVALID")) {
      return "It looks like my kitchen key (API Key) is invalid. Please double-check it in the .env file!";
    }
    return "I'm sorry, I'm having a bit of trouble in the kitchen right now. Can we try that again?";
  }
};
