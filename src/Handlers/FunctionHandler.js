import { LoadFiles } from "@Functions/FileLoader";
import { pathToFileURL } from "url";
import { basename } from "path";
import chalk from "chalk";
import Table from "cli-table3";
import ora from "ora";
import { writeLog } from "@Utils/Logs/Logger";

async function LoadFunctions(client) {
  const spinner = ora("🔍 Buscando funciones en /src/Functions...").start();
  const loadTimes = [];

  try {
    const files = await LoadFiles("/src/Functions");
    const filtered = files.filter((file) => !file.includes("FileLoader.js"));

    if (filtered.length === 0) {
      spinner.warn("⚠️ No se encontraron funciones.");
      return;
    }

    spinner.text = `📦 Cargando ${filtered.length} funciones...`;

    const results = [];

    for (const [index, file] of filtered.entries()) {
      const startTime = process.hrtime();
      const baseFile = basename(file);
      let status = false;
      let error = null;

      try {
        const functionModule = await import(pathToFileURL(file).href);
        const func = functionModule.default || functionModule;

        if (typeof func === "function") {
          func(client);
          status = true;
        } else {
          error = "No es una función válida";
        }
      } catch (err) {
        error = err.message;
      }

      const [s, ns] = process.hrtime(startTime);
      const ms = (s * 1000 + ns / 1e6).toFixed(2);
      loadTimes.push({ name: baseFile, loadTime: parseFloat(ms), status });

      let timeColor = chalk.green;
      if (ms > 100) timeColor = chalk.red;
      else if (ms > 20) timeColor = chalk.yellow;

      const symbol = status ? chalk.green("✔️") : chalk.red("❌");
      const msg = `${chalk.gray(`${index + 1}.`)} ${chalk.white(
        baseFile,
      )} ${symbol} ${timeColor(`${ms} ms`)}`;
      console.log(msg);

      results.push({ file: baseFile, status, error });
    }

    spinner.succeed("✅ Funciones cargadas correctamente.");

    const table = new Table({
      head: [
        chalk.gray("ID"),
        chalk.cyan("Función"),
        chalk.magenta("Estado"),
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

    loadTimes.forEach((data, i) => {
      const timeColor =
        data.loadTime > 100
          ? chalk.red
          : data.loadTime > 20
            ? chalk.yellow
            : chalk.green;

      table.push([
        chalk.gray(`${i + 1}.`),
        chalk.white(data.name),
        data.status ? chalk.green("✅") : chalk.red("❌"),
        timeColor(`${data.loadTime.toFixed(2)} ms`),
      ]);
    });

    console.log(chalk.bold("\n📋 Tabla resumen de funciones:"));
    console.log(table.toString());

    const slowest = loadTimes.reduce((a, b) =>
      a.loadTime > b.loadTime ? a : b,
    );
    const average =
      loadTimes.reduce((acc, val) => acc + val.loadTime, 0) / loadTimes.length;

    console.log(chalk.yellow("\n📊 Estadísticas de carga:"));
    console.log(
      chalk.magenta(
        `Función más lenta: ${slowest.name} (${slowest.loadTime.toFixed(2)} ms)`,
      ),
    );
    console.log(
      chalk.blue(`Tiempo promedio de carga: ${average.toFixed(2)} ms`),
    );

    const logLines = [];
    logLines.push("=== Registro de carga de funciones ===");
    logLines.push(`Fecha: ${new Date().toLocaleString()}`);
    logLines.push(`Funciones encontradas: ${loadTimes.length}\n`);

    loadTimes.forEach((fn, i) => {
      logLines.push(
        `${i + 1}. ${fn.name} - ${fn.loadTime.toFixed(2)} ms - Estado: ${
          fn.status ? "✅" : "❌"
        }`,
      );
    });

    logLines.push("\n--- Estadísticas ---");
    logLines.push(
      `Función más lenta: ${slowest.name} (${slowest.loadTime.toFixed(2)} ms)`,
    );
    logLines.push(`Tiempo promedio: ${average.toFixed(2)} ms`);

    const filename = `function-log-${Date.now()}.log`;
    writeLog(filename, logLines.join("\n"));
  } catch (error) {
    spinner.fail("❌ Ocurrió un error al cargar las funciones.");
    console.error(chalk.redBright(`[Error] ${error.message}`));
  }
}

export { LoadFunctions };
