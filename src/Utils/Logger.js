// src/Utils/Logs/Logger.js
import fs from "fs";
import path from "path";

export function writeLog(filename, data) {
  const logsDir = path.resolve("logs");

  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }

  const filePath = path.join(logsDir, filename);
  fs.writeFileSync(filePath, data);
  console.log(`[LOG] Archivo guardado en ${filePath}`);
}
