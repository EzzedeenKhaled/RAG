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

export async function askQuestion(question: string) {
  try {
    const response = await fetch("http://localhost:8002/ask", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question }),
    });

    if (!response.ok) {
      throw new Error("Failed to ask question");
    }

    const data = await response.json();
    return data.answer;
  } catch (error) {
    console.error("Error asking question:", error);
    throw error;
  }
}
