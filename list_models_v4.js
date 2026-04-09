const apiKey = process.env.GEMINI_API_KEY;
const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

async function listModels() {
  try {
    const response = await fetch(url);
    const data = await response.json();
    if (data.models) {
        data.models.forEach(m => {
            console.log(`- ${m.name}: ${m.displayName}`);
        });
    } else {
        console.log("No models found or error:", JSON.json(data, null, 2));
    }
  } catch (error) {
    console.error("Error listing models:", error);
  }
}

listModels();
