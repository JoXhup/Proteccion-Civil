import { Events, EmbedBuilder, ButtonInteraction, Client } from "discord.js";
import chalk from "chalk";

const errorEmbed = new EmbedBuilder()
  .setColor("Red")
  .setDescription(
    "🚧 Estamos teniendo problemas técnicos\n\nPor favor, inténtalo más tarde"
  )
  .setFooter({ text: "Nuestro equipo ha sido notificado" });

/**
 * @param {ButtonInteraction} interaction
 * @param {Error} error
 */
const handleError = async (interaction, error) => {
  console.error(chalk.red("Error al ejecutar el botón:"), error);

  const reply = { embeds: [errorEmbed], flags: "Ephemeral" };

  try {
    if (interaction.deferred || interaction.replied) {
      await interaction.editReply(reply);
    } else {
      await interaction.reply(reply);
    }
  } catch (replyError) {
    console.error(
      chalk.red("Error al responder a la interacción:"),
      replyError
    );
  }
};

export default {
  name: Events.InteractionCreate,
  /**
   * @param {ButtonInteraction} interaction
   * @param {Client} client
   */
  async execute(interaction, client) {
    if (!interaction.isButton()) return;

    const { customId } = interaction;
    const [action, serverKey] = customId.split("_");

    try {
      const button = client.buttons.get(action);
      if (!button) {
        return;
      }

      await button.execute(interaction, client, serverKey);
    } catch (error) {
      await handleError(interaction, error);
    }
  },
};
