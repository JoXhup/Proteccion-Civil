import { REST, Routes } from "discord.js";
import { pathToFileURL } from "url";
import { LoadFiles } from "../Functions/FileLoader.js";
import ora from "ora";
import chalk from "chalk";
import Table from "cli-table3";
import { writeLog } from "../Utils/Logger.js";

export async function LoadCommands(client) {
  client.commands = new Map();
  client.subCommands = new Map();

  const spinner = ora("Buscando comandos en /src/Commands...").start();
  const loadTimes = [];
  const commandsArray = [];
  const failedCommands = [];

  try {
    // ✅ Asegurar ruta relativa correcta
    const files = await LoadFiles("./src/Commands/");

    if (!files || files.length === 0) {
      spinner.warn("⚠️ No se encontraron comandos.");
      return 0;
    }

    spinner.text = `Cargando ${files.length} comandos...`;

    const table = new Table({
      head: [
        chalk.gray("ID"),
        chalk.cyan("Comando"),
        chalk.magenta("Entorno"),
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
      const command = await loadCommand(client, file);
      const [s, ns] = process.hrtime(start);
      const ms = (s * 1000 + ns / 1e6).toFixed(2);
      const status = command.status ? chalk.green("✅") : chalk.red("❌");

      loadTimes.push({
        commandName: command.name,
        loadTime: parseFloat(ms),
        status: command.status,
      });

      if (command.status) {
        commandsArray.push(command);
      } else {
        failedCommands.push(command);
      }

      table.push([
        chalk.gray(`${index + 1}.`),
        chalk.white(command.name || "Desconocido"),
        chalk.blue(getCommandEnvironment(command)),
        status,
        parseFloat(ms) > 100
          ? chalk.red(`${ms} ms`)
          : parseFloat(ms) > 20
          ? chalk.yellow(`${ms} ms`)
          : chalk.green(`${ms} ms`),
      ]);
    }

    spinner.succeed("✅ Comandos cargados correctamente.");
    console.log(chalk.bold("\n📋 Tabla resumen de comandos:"));
    console.log(table.toString());

    if (commandsArray.length === 0) {
      console.log(chalk.red("⚠️ No hay comandos válidos para registrar."));
      return 0;
    }

    const successful = loadTimes.filter((c) => c.status);
    const slowest = successful.reduce((a, b) =>
      a.loadTime > b.loadTime ? a : b
    );
    const average =
      successful.reduce((acc, val) => acc + val.loadTime, 0) /
      successful.length;

    console.log(chalk.yellow("\n📊 Estadísticas de carga:"));
    console.log(
      chalk.magenta(
        `Comando más lento: ${slowest.commandName} (${slowest.loadTime.toFixed(
          2
        )} ms)`
      )
    );
    console.log(
      chalk.blue(`Tiempo promedio de carga: ${average.toFixed(2)} ms`)
    );

    // === Guardar Log ===
    const lines = [];
    lines.push("╔══════════════════════════════════════╗");
    lines.push("║   REGISTRO DE CARGA DE COMANDOS      ║");
    lines.push("╚══════════════════════════════════════╝");
    lines.push(`Fecha: ${new Date().toLocaleString()}`);
    lines.push(`Total: ${files.length}`);
    lines.push(
      `Correctos: ${successful.length} | Fallidos: ${failedCommands.length}\n`
    );
    writeLog(`command-log-${Date.now()}.log`, lines.join("\n"));

    // ✅ Actualizar slash commands
    await updateApplicationCommands(
      client,
      commandsArray.filter((c) => !c.subCommand)
    );

    return commandsArray.length;
  } catch (err) {
    spinner.fail("❌ Error al cargar comandos.");
    console.error(chalk.redBright(`[Error] ${err.message}`));
    return 0;
  }
}

async function loadCommand(client, file) {
  try {
    const commandModule = await import(pathToFileURL(file).href);
    const command = commandModule.default || commandModule;

    if (command.subCommand) {
      return handleSubCommand(client, command);
    } else {
      return handleMainCommand(client, command);
    }
  } catch (error) {
    console.error(chalk.red(`❌ Error cargando comando desde ${file}:`), error);
    return { name: "Comando desconocido", status: false };
  }
}

function handleSubCommand(client, command) {
  const [commandName, subCommandName] = command.subCommand.split(".");
  if (!client.subCommands.has(commandName)) {
    client.subCommands.set(commandName, new Map());
  }
  client.subCommands.get(commandName).set(subCommandName, command);
  return {
    name: `${commandName}.${subCommandName}`,
    subCommand: true,
    status: true,
  };
}

function handleMainCommand(client, command) {
  if (!command?.data?.name) {
    return { name: "Sin nombre", status: false };
  }

  client.commands.set(command.data.name, command);
  return {
    ...command.data.toJSON(),
    name: command.data.name,
    subCommand: false,
    main: command.main || false,
    developer: command.developer || false,
    status: true,
  };
}

function getCommandEnvironment(command) {
  if (command.main) return "Main";
  if (command.subCommand) return "SubCmd";
  if (command.developer) return "Dev";
  return "Global";
}

async function updateApplicationCommands(client, commandsArray) {
  const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

  const guildIds = {
    dev: process.env.Developer,
    main: process.env.Main,
  };

  console.log(chalk.yellow("\n🔁 Actualizando comandos slash..."));

  const commandTypes = {
    main: (cmd) => cmd.main,
    developer: (cmd) => cmd.developer,
    global: (cmd) => !cmd.developer && !cmd.main,
  };

  const updatePromises = Object.entries(commandTypes).map(
    async ([type, filter]) => {
      const commands = commandsArray.filter(
        (cmd) => filter(cmd) && cmd.name !== "Comando desconocido"
      );

      if (commands.length === 0) return;

      const guildId = guildIds[type] || null;
      const route = guildId
        ? Routes.applicationGuildCommands(client.user.id, guildId)
        : Routes.applicationCommands(client.user.id);

      try {
        await rest.put(route, { body: commands });
        console.log(chalk.green(`✅ Comandos ${type} actualizados.`));
      } catch (error) {
        console.error(
          chalk.red(`❌ Error al actualizar comandos ${type}: ${error.message}`)
        );
      }
    }
  );

  await Promise.all(updatePromises);
}
