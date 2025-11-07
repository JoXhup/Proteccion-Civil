import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOG_DIR = path.join(__dirname, "Logs");

function ensureLogDir() {
  if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
  }
}

/**
 * Función para sanear el nombre del archivo, eliminando caracteres no válidos
 * @param {string} filename
 * @returns {string} El nombre del archivo saneado.
 */
function sanitizeFilename(filename) {
  // Reemplaza los caracteres no válidos con guiones bajos
  return filename.replace(/[<>:"/\\|?*]/g, "_").replace(/\s+/g, "_");
}

/**
 * @param {string} commandName El nombre del comando
 * @param {string} userTag El nombre de usuario que ejecutó el comando (con tag)
 * @param {number} time El tiempo de ejecución en milisegundos
 */
function writeLog(commandName, userTag, time) {
  ensureLogDir();

  // Crea el nombre del archivo con solo el nombre del comando
  const sanitizedFilename =
    sanitizeFilename(`[✅ Ejecutado] ${commandName}`) + ".log"; // Formato de nombre simplificado
  const filePath = path.join(LOG_DIR, sanitizedFilename);

  // Crea el contenido a registrar
  const logContent = `Comando ejecutado: [✅ Ejecutado] ${commandName} por ${userTag} en ${time}ms`;

  // Escribe el contenido en el archivo
  fs.writeFileSync(filePath, logContent, "utf-8");
}

export { writeLog };
