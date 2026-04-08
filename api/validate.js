import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { type, data } = req.body;

  if (!apiKey) {
    return res.status(500).json({ error: 'Gemini API Key missing in backend environment.' });
  }

  try {
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash",
      systemInstruction: `You are the "AfriFood Culinary Auditor". Your job is to strictly validate if a user's submission is a legitimate food recipe or a blog post about African culinary heritage.
      
      VALIDATION RULES:
      1. For recipes: The title, ingredients, and steps must describe a real, edible dish.
      2. For blog posts: The content must be about food, cooking, culinary culture, or kitchen memories.
      3. For images: If an image is provided, it MUST look like food, ingredients, a kitchen, or a person cooking. Reject if it's a car, tech gadget, political figure, animal (not as food), or clearly unrelated.
      4. Consistency: If a title says "Jollof Rice" but the image is a "Shoe", flag it as invalid.
      5. Reject any content that is:
         - Not about food (e.g., cars, tech, politics, sports, general lifestyle).
         - Gibberish or "spam".
         - Offensive, hateful, or clearly fake/nonsense.
      
      OUTPUT FORMAT:
      You must respond in VALID JSON format ONLY. Do not include any markdown or extra text.
      {
        "valid": boolean,
        "reason": "Clear, helpful, but firm explanation if invalid (e.g., 'AfriFood is strictly for sharing culinary heritage. This post does not appear to be food-related.'), or empty string if valid"
      }
      `
    });

    let promptParts = [];
    if (type === 'recipe') {
      promptParts.push(`Validate this recipe:
      Title: ${data.title}
      Description: ${data.short_description || ''}
      Ingredients: ${JSON.stringify(data.ingredients)}
      Steps: ${JSON.stringify(data.steps)}`);
    } else {
      promptParts.push(`Validate this blog post:
      Title: ${data.title}
      Content: ${data.content}`);
    }

    // Add main cover image if available
    if (data.image) {
      const base64Data = data.image.includes(',') ? data.image.split(',')[1] : data.image;
      promptParts.push({
        inlineData: {
          data: base64Data,
          mimeType: "image/jpeg"
        }
      });
    }

    // Add video frame optimization if available
    if (data.videoFrame) {
      const base64Frame = data.videoFrame.includes(',') ? data.videoFrame.split(',')[1] : data.videoFrame;
      promptParts.push("This is a key frame selected from the user's uploaded video. Ensure it also matches the recipe heritage.");
      promptParts.push({
        inlineData: {
          data: base64Frame,
          mimeType: "image/jpeg"
        }
      });
    }

    const result = await model.generateContent(promptParts);
    const response = await result.response;
    const text = response.text();
    
    // Improved JSON parsing to handle potential markdown wrappers
    try {
      const cleanJson = text.replace(/```json\n?|```/g, '').trim();
      const validation = JSON.parse(cleanJson);
      return res.status(200).json(validation);
    } catch (parseError) {
      console.error("JSON Parse Error. Raw text:", text);
      // Fallback to extraction if parsing fails
      const match = text.match(/\{[\s\S]*\}/);
      if (match) {
        try {
          return res.status(200).json(JSON.parse(match[0]));
        } catch (e) {
          return res.status(200).json({ valid: true, reason: "" });
        }
      }
      return res.status(200).json({ valid: true, reason: "" }); 
    }

  } catch (error) {
    console.error("Gemini Validation Error:", error);
    return res.status(500).json({ 
      error: error.message || 'Error processing validation' 
    });
  }
}
