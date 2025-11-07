import { Events, EmbedBuilder, UserSelectMenuInteraction } from "discord.js";

export default {
  name: Events.InteractionCreate,
  /**
   * @param {UserSelectMenuInteraction} interaction
   * @param {Client} client
   */

  async execute(interaction, client) {
    if (interaction.isUserSelectMenu()) {
      const Menu = client.menus.get(interaction.customId);
      if (!Menu) return;

      try {
        await Menu.execute(interaction, client);
      } catch (error) {
        console.error(error);

        const errorEmbed = new EmbedBuilder()
          .setColor("Red")
          .setAuthor({
            name: client.user.username,
            iconURL: client.user.displayAvatarURL(),
          })
          .setTitle("⚠️ Error al ejecutar el menú de selección de usuario")
          .setDescription(
            "Ocurrió un error inesperado al intentar ejecutar esta acción. Por favor, intenta de nuevo."
          )
          .addFields({
            name: "Detalles del error",
            value: error.message || "No se pudo obtener información del error.",
          })
          .setFooter({ text: "Si el problema persiste, contacta al soporte." });

        if (interaction.replied || interaction.deferred) {
          await interaction.followUp({ embeds: [errorEmbed], ephemeral: true });
        } else {
          await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }
      }
    }
  },
};
