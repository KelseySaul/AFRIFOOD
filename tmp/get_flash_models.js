const fs = require('fs');
const dotenv = fs.readFileSync('.env.local', 'utf8');
const keyMatch = dotenv.match(/GEMINI_API_KEY=\"(.*)\"/);
if (keyMatch) {
  const apiKey = keyMatch[1];
  fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`)
    .then(res => res.json())
    .then(data => {
      if (data.models) {
        console.log("AVAILABLE MODELS:");
        const flashModels = data.models.filter(m => m.name.includes('flash') && m.supportedGenerationMethods.includes('generateContent'));
        flashModels.forEach(m => console.log("- " + m.name));
      } else {
        console.log(JSON.stringify(data, null, 2));
      }
    });
}
