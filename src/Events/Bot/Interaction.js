import {
  Events,
  ChatInputCommandInteraction,
  Collection,
  Client,
  EmbedBuilder,
} from "discord.js";

import chalk from "chalk";

import { writeLog } from "@Utils/Logs/Logger";

const formatCooldown = (seconds) => {
  const units = [
    { value: 86400, label: "d" },

    { value: 3600, label: "h" },

    { value: 60, label: "m" },

    { value: 1, label: "s" },
  ];

  return units

    .reduce((time, { value, label }) => {
      const count = Math.floor(seconds / value);

      seconds %= value;

      return count > 0 ? `${time}${count}${label} ` : time;
    }, "")

    .trim();
};

const handleError = async (interaction, client, error, startTime) => {
  const endTime = Date.now();

  const executionTime = endTime - startTime;

  console.error(chalk.red(`[❌ Error @ ${interaction.commandName}]`), error);

  writeLog(interaction.commandName, interaction.user.tag, executionTime);

  const errorEmbed = new EmbedBuilder()

    .setColor("Red")

    .setThumbnail(client.user.displayAvatarURL())

    .setTitle("Error Detectado")

    .setDescription(
      "⚙️ Estamos teniendo problemas técnicos. Intenta de nuevo más tarde.",
    );

  const reply = {
    embeds: [errorEmbed],

    flags: "Ephemeral",
  };

  if (!interaction.deferred && !interaction.replied) {
    await interaction.reply(reply).catch(() => {});
  } else {
    await interaction.editReply(reply).catch(() => {});
  }

  client.lastError = error;
};

export default {
  name: Events.InteractionCreate,
  /**
   * @param {ChatInputCommandInteraction} interaction
   * @param {Client} client
   */

  async execute(interaction, client) {
    if (!client.cooldowns) client.cooldowns = new Collection();

    const startTime = Date.now();

    const { commandName, user } = interaction;

    try {
      if (interaction.isAutocomplete()) {
        const command = client.commands.get(interaction.commandName);

        return command?.autocomplete
          ? command.autocomplete(interaction, client)
          : interaction.respond([]);
      }

      if (!interaction.isCommand()) return;

      const command = client.commands.get(interaction.commandName);

      if (!command) {
        return interaction.reply({
          embeds: [
            new EmbedBuilder()

              .setColor("Red")

              .setThumbnail(client.user.displayAvatarURL())

              .setDescription("⚙️ Este comando está desactualizado.")

              .setFooter({ text: "Inténtalo en un par de minutos." }),
          ],

          flags: "Ephemeral",
        });
      } // Cooldown

      if (command.cooldown) {
        const now = Date.now();

        const cooldownAmount = command.cooldown * 1000;

        const userCooldowns =
          client.cooldowns.get(commandName) ?? new Collection();

        client.cooldowns.set(commandName, userCooldowns);

        const expirationTime = userCooldowns.get(user.id);

        if (expirationTime && now < expirationTime) {
          const timeLeft = (expirationTime - now) / 1000;

          return interaction.reply({
            embeds: [
              new EmbedBuilder()

                .setColor("Orange")

                .setTitle("⏳ Cooldown activo")

                .setDescription(
                  `Debes esperar **${formatCooldown(timeLeft)}** antes de volver a usar \`/${commandName}\`.`,
                ),
            ],

            flags: "Ephemeral",
          });
        }

        userCooldowns.set(user.id, now + cooldownAmount);

        setTimeout(() => userCooldowns.delete(user.id), cooldownAmount);
      } // Subcommand

      const subCommandName = interaction.options.getSubcommand(false);

      if (subCommandName) {
        const subCommand = client.subCommands

          .get(interaction.commandName)

          ?.get(subCommandName);

        if (subCommand) {
          await subCommand.execute(interaction, client);

          const execTime = Date.now() - startTime;

          writeLog(commandName, user.tag, execTime);

          return;
        } else {
          return interaction.reply({
            embeds: [
              new EmbedBuilder()

                .setColor("Red")

                .setThumbnail(client.user.displayAvatarURL())

                .setDescription("⚙️ Este subcomando está desactualizado.")

                .setFooter({ text: "Inténtalo en un par de minutos." }),
            ],

            flags: "Ephemeral",
          });
        }
      }

      await command.execute(interaction, client);

      const endTime = Date.now();

      const executionTime = endTime - startTime;

      console.log(
        chalk.green(`[✅ Ejecutado]`),

        chalk.cyan(`/${commandName}`),

        chalk.gray(`por ${user.tag} (${user.id}) en ${executionTime}ms`),
      );

      writeLog(commandName, user.tag, executionTime);
    } catch (error) {
      await handleError(interaction, client, error, startTime);
    }
  },
};
