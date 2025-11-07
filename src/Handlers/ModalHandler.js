import { LoadFiles } from "../Functions/FileLoader.js";
import { pathToFileURL } from "url";
import chalk from "chalk";
import ora from "ora";
import Table from "cli-table3";

async function LoadModals(client) {
  client.modals = new Map();

  const spinner = ora("🔍 Buscando modals en /src/Modals...").start();
  const modalsArray = [];
  const failedModals = [];

  try {
    const files = await LoadFiles("/src/Modals/");

    if (files.length === 0) {
      spinner.warn("No se encontraron modals.");
      return;
    }

    spinner.text = `Cargando ${files.length} modals...`;

    const table = new Table({
      head: [chalk.gray("ID"), chalk.cyan("Modal"), chalk.green("Estado")],
      style: { head: [], border: [] },
      chars: {
        top: "═", topMid: "╤", topLeft: "╔", topRight: "╗",
        bottom: "═", bottomMid: "╧", bottomLeft: "╚", bottomRight: "╝",
        left: "║", leftMid: "╟", mid: "─", midMid: "┼",
        right: "║", rightMid: "╢", middle: "│",
      },
    });

    for (const [index, file] of files.entries()) {
      const { modalId, status } = await loadModal(client, file);

      table.push([
        chalk.gray(`${index + 1}.`),
        chalk.white(modalId || "Modal Desconocido"),
        status ? chalk.green("✅") : chalk.red("❌"),
      ]);

      if (status) {
        modalsArray.push({ modalId, status });
      } else {
        failedModals.push({ modalId, status });
      }
    }

    spinner.succeed("📥 Modals cargados correctamente.");
    console.log(chalk.bold("\n📋 Tabla resumen de modals:"));
    console.log(table.toString());

    const total = modalsArray.length + failedModals.length;
    console.log(chalk.blue(`Modals cargados: ${modalsArray.length}/${total}`));
    console.log(chalk.red(`Errores: ${failedModals.length}/${total}`));
  } catch (error) {
    spinner.fail("❌ Error al cargar modals.");
    console.error(chalk.redBright(`[ModalHandler Error] ${error.message}`));
  }
}

async function loadModal(client, file) {
  try {
    const modalModule = await import(pathToFileURL(file).href);
    const modal = modalModule.default || modalModule;

    if (!modal?.customId) {
      throw new Error("Falta `customId` en el modal");
    }

    client.modals.set(modal.customId, modal);
    return { modalId: modal.customId, status: true };
  } catch (error) {
    const modalName = file.split("/").pop().replace(".js", "");
    console.error(chalk.redBright(`[Error Modal] ${modalName}: ${error.message}`));
    return { modalId: modalName, status: false };
  }
}

export { LoadModals };
