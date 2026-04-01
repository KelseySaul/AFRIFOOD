
export const getChakulaResponse = async (userMessage, history = []) => {
  try {
    console.log("Sending message to backend proxy...");
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: userMessage,
        history: history,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Server responded with ${response.status}`);
    }

    const data = await response.json();
    console.log("Backend response received:", data.text);
    return data.text;
  } catch (error) {
    console.error("Chat API Error Detail:", error);
    if (error.message?.includes("leaked") || error.message?.includes("403")) {
      return "It looks like my kitchen security system flagged a leak. Please ensure the new API key is set in the Vercel dashboard!";
    }
    return "I'm sorry, I'm having a bit of trouble in the kitchen right now. Can we try that again?";
  }
};
