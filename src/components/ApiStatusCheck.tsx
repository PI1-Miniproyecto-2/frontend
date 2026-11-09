import { useEffect, useState } from "react";
import { verificarBackend } from "../services/api";

export default function ApiStatusCheck() {
  const [estado, setEstado] = useState("Verificando...");
  const [respuesta, setRespuesta] = useState("");

  useEffect(() => {
    verificarBackend()
      .then((data) => {
        setEstado("Backend conectado");
        setRespuesta(JSON.stringify(data, null, 2));
      })
      .catch((error) => {
        setEstado("Backend desconectado");
        console.error(error);
      });
  }, []);

  return (
    <div>
      <h3>Estado de conexión: {estado}</h3>
      <pre>{respuesta}</pre>
    </div>
  );
}