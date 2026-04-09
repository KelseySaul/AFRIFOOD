const apiKey = process.env.GEMINI_API_KEY;
const models = ["models/gemini-2.5-flash", "models/gemini-3.1-flash-live-preview", "models/gemini-2.0-flash"];

async function testModels() {
  for (const model of models) {
    try {
      console.log(`Testing ${model}...`);
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/${model}:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: "Hello" }] }]
        })
      });
      const data = await response.json();
      if (response.ok) {
        console.log(`✅ ${model} works!`);
      } else {
        console.log(`❌ ${model} failed: ${data.error?.status} - ${data.error?.message}`);
        if (data.error?.message?.includes("quota")) {
            console.log(`   (Quota exceeded details: ${JSON.stringify(data.error.details)})`);
        }
      }
    } catch (e) {
      console.log(`❌ ${model} error: ${e.message}`);
    }
  }
}

testModels();
