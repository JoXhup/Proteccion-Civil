import { LoadFiles } from "../Functions/FileLoader.js";
import { pathToFileURL } from "url";
import path from "path";
import chalk from "chalk";
import ora from "ora";
import Table from "cli-table3";

async function LoadMenu(client) {
  client.menus = new Map();

  const spinner = ora("🔍 Buscando menús en /src/Utils/Menus...").start();
  const loadTimes = [];
  const menusArray = [];
  const failedMenus = [];

  try {
    // ✅ Asegura ruta absoluta correcta
    const folderPath = path.join(process.cwd(), "src", "Utils", "Menus");
    const files = await LoadFiles(folderPath);

    if (!files || files.length === 0) {
      spinner.warn("⚠️ No se encontraron menús en /src/Utils/Menus.");
      return;
    }

    spinner.text = `📦 Cargando ${files.length} menús...`;

    const table = new Table({
      head: [
        chalk.gray("ID"),
        chalk.cyan("Menú"),
        chalk.green("Estado"),
        chalk.yellow("Tiempo (ms)"),
      ],
      style: { head: [], border: [] },
      chars: {
        top: "═",
        topMid: "╤",
        topLeft: "╔",
        topRight: "╗",
        bottom: "═",
        bottomMid: "╧",
        bottomLeft: "╚",
        bottomRight: "╝",
        left: "║",
        leftMid: "╟",
        mid: "─",
        midMid: "┼",
        right: "║",
        rightMid: "╢",
        middle: "│",
      },
    });

    for (const [index, file] of files.entries()) {
      const start = process.hrtime();
      const menu = await loadMenu(client, file);
      const [seconds, nanoseconds] = process.hrtime(start);
      const loadTime = (seconds * 1000 + nanoseconds / 1e6).toFixed(2);
      const status = menu.status ? chalk.green("✅") : chalk.red("❌");

      loadTimes.push({ menuName: menu.name, loadTime: parseFloat(loadTime) });

      if (menu.status) {
        menusArray.push(menu);
      } else {
        failedMenus.push(menu);
      }

      table.push([
        chalk.gray(`${index + 1}.`),
        chalk.white(menu.name || "Menú Desconocido"),
        status,
        parseFloat(loadTime) > 100
          ? chalk.red(`${loadTime} ms`)
          : parseFloat(loadTime) > 20
          ? chalk.yellow(`${loadTime} ms`)
          : chalk.green(`${loadTime} ms`),
      ]);
    }

    spinner.succeed("✅ Menús cargados correctamente.");
    console.log(chalk.bold("\n📋 Tabla resumen de menús:"));
    console.log(table.toString());

    if (loadTimes.length > 0) {
      const successful = menusArray.filter((m) => m.status);
      const slowestMenu = loadTimes.reduce((prev, current) =>
        prev.loadTime > current.loadTime ? prev : current
      );
      const averageTime =
        successful.reduce((sum, { loadTime }) => sum + loadTime, 0) /
        successful.length;

      console.log(chalk.yellow("\n📊 Estadísticas de carga:"));
      console.log(
        chalk.magenta(
          `Menú más lento: ${slowestMenu.menuName} (${slowestMenu.loadTime.toFixed(2)} ms)`
        )
      );
      console.log(
        chalk.blue(`Tiempo promedio de carga: ${averageTime.toFixed(2)} ms`)
      );
      console.log(
        chalk.blue(
          `Menús cargados correctamente: ${menusArray.length}/${files.length}`
        )
      );
      console.log(
        chalk.red(`Menús con errores: ${failedMenus.length}/${files.length}`)
      );
    } else {
      console.log(chalk.yellow("⚠️ No se cargaron menús válidos."));
    }
  } catch (error) {
    spinner.fail("❌ Ocurrió un error al cargar los menús.");
    console.error(chalk.red("Error cargando menús:"), error);
  }
}

async function loadMenu(client, file) {
  try {
    const menuModule = await import(pathToFileURL(file).href);
    const menu = menuModule.default || menuModule;

    if (menu.name && typeof menu.execute === "function") {
      client.menus.set(menu.name, menu);
      return { name: menu.name, status: true };
    } else {
      console.warn(`⚠️ El menú en ${file} no exporta propiedades válidas.`);
      return { name: path.basename(file), status: false };
    }
  } catch (error) {
    console.error(chalk.red(`❌ Error cargando menú desde ${file}:`), error);
    return { name: path.basename(file), status: false };
  }
}

export default LoadMenu;
