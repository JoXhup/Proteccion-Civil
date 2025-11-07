import { readdirSync } from "fs";
import path from "path";
import chalk from "chalk";
import ora from "ora";

/**
 * Carga todos los select menus desde /src/Utils/Menus/
 * y los registra en client.selectMenus
 */
export default async function loadSelectMenus(client) {
  client.selectMenus = new Map();

  const folderPath = path.join(process.cwd(), "src", "Utils", "Menus");
  const spinner = ora("🔍 Buscando menús en /src/Utils/Menus...").start();

  try {
    const files = readdirSync(folderPath).filter(f => f.endsWith(".js"));

    if (files.length === 0) {
      spinner.warn("⚠️ No se encontraron menús en /src/Utils/Menus.");
      console.log(chalk.yellow("✔ No hay menús que cargar."));
      return;
    }

    spinner.text = `📦 Cargando ${files.length} menú(s)...`;

    for (const file of files) {
      const menuPath = path.join(folderPath, file);
      try {
        const menuModule = await import(`file://${menuPath}`);
        const menu = menuModule.default || menuModule;

        if (!menu?.customId || typeof menu.execute !== "function") {
          console.warn(chalk.yellow(`⚠️ Menú inválido o sin execute(): ${file}`));
          continue;
        }

        client.selectMenus.set(menu.customId, menu);
        console.log(chalk.green(`✅ SelectMenu cargado: ${menu.customId}`));
      } catch (err) {
        console.error(chalk.red(`❌ Error cargando menú ${file}:`), err);
      }
    }

    spinner.succeed("✅ SelectMenus cargados correctamente.");
  } catch (error) {
    spinner.fail("❌ Error al cargar los select menus.");
    console.error(chalk.red("Detalles:"), error);
  }
}
