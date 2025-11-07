import { LoadFiles } from "@Functions/FileLoader";
import { pathToFileURL } from "url";
import chalk from "chalk";
import Table from "cli-table3";
import ora from "ora";
import { writeLog } from "@Utils/Logs/Logger";

async function LoadEvents(client) {
  client.events = new Map();
  const loadTimes = [];

  const spinner = ora("🔍 Buscando eventos en /src/Events...").start();

  try {
    const files = await LoadFiles("/src/Events");

    if (files.length === 0) {
      spinner.warn("⚠️ No se encontraron eventos.");
      return;
    }

    spinner.text = `📦 Cargando ${files.length} eventos...`;

    for (const [index, file] of files.entries()) {
      const startTime = process.hrtime();
      const { eventName, status } = await loadEvent(client, file);
      const [s, ns] = process.hrtime(startTime);
      const ms = (s * 1000 + ns / 1e6).toFixed(2);
      loadTimes.push({ eventName, loadTime: parseFloat(ms) });

      let timeColor = chalk.green;
      if (parseFloat(ms) > 100) timeColor = chalk.red;
      else if (parseFloat(ms) > 20) timeColor = chalk.yellow;

      const symbol = status ? chalk.green("✔️") : chalk.red("❌");
      const eventLine = `${chalk.gray(`${index + 1}.`)} ${chalk.white(
        eventName || "Evento Desconocido",
      )} ${symbol} ${timeColor(`${ms} ms`)}`;
      console.log(eventLine);
    }

    spinner.succeed("✅ Eventos cargados correctamente.");

    const table = new Table({
      head: [
        chalk.gray("ID"),
        chalk.cyan("Evento"),
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
        chalk.white(data.eventName),
        chalk.green("✅"),
        timeColor(`${data.loadTime.toFixed(2)} ms`),
      ]);
    });

    console.log(chalk.bold("\n📋 Tabla resumen de eventos:"));
    console.log(table.toString());

    const slowest = loadTimes.reduce((a, b) =>
      a.loadTime > b.loadTime ? a : b,
    );
    const average =
      loadTimes.reduce((acc, val) => acc + val.loadTime, 0) / loadTimes.length;

    console.log(chalk.yellow("\n📊 Estadísticas de carga:"));
    console.log(
      chalk.magenta(
        `Evento más lento: ${slowest.eventName} (${slowest.loadTime.toFixed(
          2,
        )} ms)`,
      ),
    );
    console.log(
      chalk.blue(`Tiempo promedio de carga: ${average.toFixed(2)} ms`),
    );

    const logLines = [];
    logLines.push("=== Registro de carga de eventos ===");
    logLines.push(`Fecha: ${new Date().toLocaleString()}`);
    logLines.push(`Eventos encontrados: ${loadTimes.length}\n`);

    loadTimes.forEach((event, i) => {
      logLines.push(
        `${i + 1}. ${event.eventName} - ${event.loadTime.toFixed(
          2,
        )} ms - Estado: ✅`,
      );
    });

    logLines.push("\n--- Estadísticas ---");
    logLines.push(
      `Evento más lento: ${slowest.eventName} (${slowest.loadTime.toFixed(
        2,
      )} ms)`,
    );
    logLines.push(`Tiempo promedio: ${average.toFixed(2)} ms`);

    const filename = `event-log-${Date.now()}.log`;
    writeLog(filename, logLines.join("\n"));
  } catch (err) {
    spinner.fail("❌ Ocurrió un error al cargar los eventos.");
    console.error(chalk.redBright(`[Error] ${err.message}`));
  }
}

async function loadEvent(client, file) {
  try {
    const eventModule = await import(pathToFileURL(file).href);
    const event = eventModule.default || eventModule;

    if (!event.name) {
      throw new Error(`El evento en ${file} no tiene nombre.`);
    }

    const execute = (...args) => event.execute(...args, client);

    // Detecta el tipo de sistema para registrar el evento
    const moonlinkEvents = [
      "nodeConnect",
      "nodeDisconnect",
      "nodeError",
      "trackStart",
      "trackEnd",
      "queueEnd",
      "playerUpdate",
    ];

    let target;
    if (event.rest) {
      target = client.rest;
    } else if (client.moon && moonlinkEvents.includes(event.name)) {
      target = client.moon;
    } else {
      target = client;
    }

    target[event.once ? "once" : "on"](event.name, execute);
    client.events.set(event.name, execute);

    return { eventName: event.name, status: true };
  } catch (error) {
    const eventName = file.split("/").pop().slice(0, -3);
    console.error(
      chalk.redBright(`[Error] Cargando ${eventName}: ${error.message}`),
    );
    return { eventName, status: false };
  }
}

export { LoadEvents };
