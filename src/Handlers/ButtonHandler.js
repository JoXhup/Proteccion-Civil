import { LoadFiles } from "../Functions/FileLoader.js";
import { pathToFileURL } from "url";
import chalk from "chalk";
import ora from "ora";
import Table from "cli-table3";

async function LoadButtons(client) {
  client.buttons = new Map();

  const spinner = ora("Buscando botones en /src/Utils/Buttons...").start();
  const buttonsArray = [];
  const failedButtons = [];

  try {
    const files = await LoadFiles("/src/Utils/Buttons/");

    if (files.length === 0) {
      spinner.warn("No se encontraron botones.");
      return;
    }

    spinner.text = `Cargando ${files.length} botones...`;

    const table = new Table({
      head: [chalk.gray("ID"), chalk.cyan("Botón"), chalk.green("Estado")],
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
      const { buttonName, status } = await loadButton(client, file);

      if (status) {
        buttonsArray.push({ buttonName, status });
      } else {
        failedButtons.push({ buttonName, status });
      }

      table.push([
        chalk.gray(`${index + 1}.`),
        chalk.white(buttonName || "Botón Desconocido"),
        status ? chalk.green("✅") : chalk.red("❌"),
      ]);
    }

    spinner.succeed("Botones cargados correctamente.");
    console.log(chalk.bold("\n📋 Tabla resumen de botones:"));
    console.log(table.toString());

    console.log(chalk.yellow("\n📊 Estadísticas de carga:"));
    const totalButtons = buttonsArray.length + failedButtons.length;
    const loadedButtons = buttonsArray.length;
    const failedCount = failedButtons.length;
    console.log(
      chalk.blue(
        `Botones cargados correctamente: ${loadedButtons}/${totalButtons}`
      )
    );
    console.log(
      chalk.red(`Botones con errores: ${failedCount}/${totalButtons}`)
    );
  } catch (error) {
    spinner.fail("Ocurrió un error al cargar los botones.");
    console.error(chalk.redBright(`[Error] ${error.message}`));
  }
}

async function loadButton(client, file) {
  try {
    const buttonModule = await import(pathToFileURL(file).href);
    const button = buttonModule.default || buttonModule;

    if (!button.name) {
      throw new Error("ButtonID No Encontrado");
    }

    client.buttons.set(button.name, button);

    return { buttonName: button.name, status: true };
  } catch (error) {
    const buttonName = file.split("/").pop().slice(0, -3);
    console.error(
      chalk.redBright(`[Error] Cargando ${buttonName}: ${error.message}`)
    );
    return { buttonName, status: false };
  }
}

export { LoadButtons };
