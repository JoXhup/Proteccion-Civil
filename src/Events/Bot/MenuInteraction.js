import { Events, StringSelectMenuInteraction, EmbedBuilder } from "discord.js";

export default {
  name: Events.InteractionCreate,
  /**
   * @param {StringSelectMenuInteraction} interaction
   * @param {Client} client
   */

  async execute(interaction, client) {
    if (interaction.isStringSelectMenu()) {
      const { customId } = interaction;
      const [action, ownerId] = customId.split("_");

      const Menu = client.menus.get(action);

      if (!Menu) {
        console.warn(
          `⚠️ Menú no encontrado: ${action}. Verifica que esté registrado correctamente.`
        );
        return interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setColor("Yellow")
              .setTitle("⚠️ Menú no disponible")
              .setDescription(
                "Este menú no está disponible actualmente. Por favor, contacta al administrador si crees que esto es un error."
              ),
          ],
          flags: "Ephemeral",
        });
      }

      try {
        await Menu.execute(interaction, client, ownerId);
      } catch (error) {
        console.error(`❌ Error al ejecutar el menú ${action}:`, error);

        const errorEmbed = new EmbedBuilder()
          .setColor("Red")
          .setAuthor({
            name: client.user.username,
            iconURL: client.user.displayAvatarURL(),
          })
          .setTitle("⚠️ Error al ejecutar el menú")
          .setDescription(
            "Ocurrió un error inesperado al intentar ejecutar esta acción. Por favor, intenta de nuevo."
          )
          .addFields({
            name: "Detalles del error",
            value: error.message || "No se pudo obtener información del error.",
          })
          .setFooter({ text: "Desarrolladores avisados" });

        if (interaction.replied || interaction.deferred) {
          await interaction.followUp({
            embeds: [errorEmbed],
            flags: "Ephemeral",
          });
        } else {
          await interaction.reply({ embeds: [errorEmbed], flags: "Ephemeral" });
        }
      }
    }
  },
};
