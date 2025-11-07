import { readdirSync } from "fs";
import path from "path";

export default async function loadSelectMenus(client) {
  client.selectMenus = new Map();

  const folderPath = path.join(process.cwd(), "src", "selectMenus");

  for (const file of readdirSync(folderPath).filter(f => f.endsWith(".js"))) {
    const menu = (await import(`../selectMenus/${file}`)).default;

    if (!menu?.customId || typeof menu.execute !== "function") {
      console.warn(`[⚠️] Menú inválido: ${file}`);
      continue;
    }

    client.selectMenus.set(menu.customId, menu);
    console.log(`[✅] SelectMenu cargado: ${menu.customId}`);
  }
}
