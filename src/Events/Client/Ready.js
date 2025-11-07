import { ActivityType, Events } from "discord.js";
import { LoadCommands } from "../../Handlers/CommandHandler.js";
import { LoadFunctions } from "../../Handlers/FunctionHandler.js";
import { LoadButtons } from "../../Handlers/ButtonHandler.js";
import LoadMenu from "../../Handlers/MenuHandler.js";
import chalk from "chalk";
import mongoose from "mongoose";
import ora from "ora";

/**
 * Evento que se ejecuta cuando el bot está listo.
 */
export default {
  name: Events.ClientReady,
  once: true,

  /**
   * @param {import("discord.js").Client} client
   */
  async execute(client) {
    console.clear();
    const spinner = ora("Inicializando bot...").start();

    try {
      // --- 1️⃣ Cargar Comandos ---
      spinner.text = "Cargando comandos...";
      const commandsLoaded = await LoadCommands(client);
      spinner.succeed(`✅ Comandos cargados (${commandsLoaded || "desconocido"}).`);

      // --- 2️⃣ Cargar Funciones ---
      spinner.start("Cargando funciones...");
      await LoadFunctions(client);
      spinner.succeed("✅ Funciones cargadas correctamente.");

      // --- 3️⃣ Cargar Botones ---
      spinner.start("Cargando botones...");
      await LoadButtons(client);
      spinner.succeed("✅ Botones cargados correctamente.");

      // --- 4️⃣ Cargar Menús ---
      spinner.start("Cargando menús...");
      await LoadMenu(client);
      spinner.succeed("✅ Menús cargados correctamente.");

      // --- 5️⃣ Conectar a MongoDB ---
      spinner.start("Conectando a MongoDB...");
      await mongoose.connect(process.env.MongoURI);
      spinner.succeed("✅ Conexión establecida con MongoDB.");

      // --- 6️⃣ Estado del Bot ---
      const activities = [
        { name: "MXRP", type: ActivityType.Playing },
        { name: "Protección Civil", type: ActivityType.Watching },
      ];
      const random = activities[Math.floor(Math.random() * activities.length)];
      client.user.setActivity(random.name, { type: random.type });

      spinner.succeed(chalk.green(`Bot listo como ${client.user.tag}`));
      console.log(
        chalk.cyan.bold(
          `──────────────────────────────────────────────\n` +
            `🤖 Bot conectado como: ${chalk.green(client.user.tag)}\n` +
            `💬 Servidores: ${chalk.yellow(client.guilds.cache.size)}\n` +
            `⚙️ Comandos cargados: ${chalk.yellow(client.commands.size)}\n` +
            `──────────────────────────────────────────────`
        )
      );
    } catch (error) {
      spinner.fail("❌ Error durante la carga del bot");
      console.error(chalk.red(error.stack || error));
    }
  },
};
