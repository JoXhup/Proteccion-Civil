// src/utils/logs/logger.js
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Escribe un log en la carpeta /logs con nombre y contenido especificados.
 * Si la carpeta no existe, se crea automáticamente.
 *
 * @param {string} filename - Nombre del archivo (ej: "verificacion.log")
 * @param {string} data - Texto o contenido del log
 */
export function writeLog(filename, data) {
  try {
    const logsDir = path.resolve(__dirname, "../../../logs");

    // Crear carpeta si no existe
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }

    // Agrega fecha y hora al contenido
    const timestamp = new Date().toLocaleString("es-MX", {
      timeZone: "America/Mexico_City",
    });

    const content = `\n[${timestamp}] ${data}\n`;
    const filePath = path.join(logsDir, filename);

    fs.appendFileSync(filePath, content, "utf8");

    console.log(`[LOG] Archivo guardado en ${filePath}`);
  } catch (error) {
    console.error(`[Error Logger] ${error.message}`);
  }
}
