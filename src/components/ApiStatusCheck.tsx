import { useEffect, useState } from "react";
import { verificarBackend } from "../services/ApiTemp";

export default function ApiStatusCheck() {
  const [estado, setEstado] = useState("Verificando...");
  const [respuesta, setRespuesta] = useState("");

  useEffect(() => {
    verificarBackend()
     .then((data: unknown) => {
        setEstado("Backend conectado");
        setRespuesta(JSON.stringify(data, null, 2));
      })
      .catch((error: unknown) => {
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