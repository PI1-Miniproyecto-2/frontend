const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:3000";

export async function verificarBackend() {
  const response = await fetch(
    `${API_URL}/api/v1/system/status`
  );

  if (!response.ok) {
    throw new Error("Error al conectar con el backend");
  }

  return await response.json();
}