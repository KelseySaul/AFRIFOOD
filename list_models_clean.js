const apiKey = "AIzaSyBxRE8mlkiLTgMtd3xlfGcLBG2agp2emx4";

async function list() {
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    const data = await response.json();
    if (data.models) {
      console.log("SUPPORTED MODELS:");
      data.models.forEach(m => console.log("- " + m.name));
    } else {
      console.log(JSON.stringify(data, null, 2));
    }
  } catch (e) {
    console.error(e);
  }
}

list();
