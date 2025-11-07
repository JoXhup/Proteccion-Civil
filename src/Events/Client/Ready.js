import { ActivityType, Events } from "discord.js";
import { LoadCommands } from "../../Handlers/CommandHandler";
import { LoadFunctions } from "../../Handlers/FunctionHandler";
import { LoadButtons } from "../../Handlers/ButtonHandler";
import LoadMenu from "../../Handlers/MenuHandler"; // ✅ AQUÍ CORREGIDO
import chalk from "chalk";
import mongoose from "mongoose";
import ora from "ora";

export default {
  name: Events.ClientReady,
  /**
   * @param {Client} client
   */
  async execute(client) {
    const Activities = [
      { name: "SSPC", type: ActivityType.Watching },
      { name: "MXRP", type: ActivityType.Playing },
    ];

    const SelectActivity = () =>
      Activities[Math.floor(Math.random() * Activities.length)];

    // Database connection
    const dbSpinner = ora("Conectando a MongoDB...").start();
    try {
      await LoadCommands(client);
      await LoadFunctions(client);
      await LoadButtons(client);
      await LoadMenu(client); // ✅ Esto ahora funciona correctamente
      await mongoose.connect(process.env.MongoURI);
      dbSpinner.succeed(chalk.green("MongoDB conectado correctamente."));
    } catch (error) {
      dbSpinner.fail(chalk.red("Error al conectar a MongoDB."));
      console.error(chalk.redBright("[MongoDB] →"), error.message);
    }

    // Bot activity
    const botSpinner = ora("Inicializando actividad del bot...").start();
    try {
      const ActivityBot = SelectActivity();
      client.user.setActivity(ActivityBot.name, { type: ActivityBot.type });
      botSpinner.succeed(
        chalk.cyan(
          `Actividad establecida: ${ActivityBot.name} (${ActivityBot.type})`
        )
      );
      console.log(
        chalk.bold.green(
          `[Bot listo] → ${client.user.tag} conectado con éxito.`
        )
      );
    } catch (error) {
      botSpinner.fail(chalk.red("Error al establecer actividad del bot."));
      console.error(error);
    }
  },
};
