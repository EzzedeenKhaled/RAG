export async function uploadAndProcessPDF(file: File) {
  const formData = new FormData();
  formData.append("file", file);

  try {
    const response = await fetch("http://localhost:8002/upload", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) return false;

    const data = await response.json();
    return data.status === "success";
  } catch (error) {
    console.error("API Error:", error);
    return false;
  }
}

export async function askQuestion(question: string, webSearch: boolean) {
  try {
    const response = await fetch("http://localhost:8002/ask", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question, web_search: webSearch }),
    });

    if (!response.ok) {
      throw new Error("Failed to ask question");
    }

    return response.body;
  } catch (error) {
    console.error("Error asking question:", error);
    throw error;
  }
}
