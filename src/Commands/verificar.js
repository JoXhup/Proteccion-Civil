import {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from "discord.js";

export default {
  data: new SlashCommandBuilder()
    .setName("verificar")
    .setDescription("Envía el panel de verificación al canal correspondiente."),

  async execute(interaction, client) {
    // ⚠️ Importante: Cambia "1352357126743392308" por el ID del Director General.
    if (interaction.user.id !== "1352357126743392308") {
      // Responder y RETORNAR inmediatamente si no está autorizado
      return interaction.reply({
        content: "🚫 Solo el Director General puede usar este comando.",
        ephemeral: true,
      });
    }

    // ⚠️ Importante: Cambia "1435028189251375295" por el ID del canal de verificación.
    const canalId = "1435028189251375295";
    const canal = interaction.guild.channels.cache.get(canalId);

    if (!canal) {
      // Responder y RETORNAR si el canal no existe
      return interaction.reply({
        content: "⚠️ No se encontró el canal de verificación.",
        ephemeral: true,
      });
    }

    // Embed principal del panel (sin cambios)
    const embed = new EmbedBuilder()
      .setTitle("📋 Bienvenido Protección Civil – MXRP")
      .setDescription(
        `Es un orgullo tenerte en nuestro servidor, pero debes pasar por un paso importante de **verificación** para validar cuentas reales.\n\n` +
          `El sistema de verificación es muy sencillo, acá mismo te explicamos cómo hacerlo:\n\n` +
          `> • Haz click en el botón inferior **INICIAR**\n` +
          `> • Analiza la imagen que se te proporciona\n` +
          `> • Recuerda el mensaje o código mostrado\n` +
          `> • Haz click en **Verificarme**\n` +
          `> • Coloca el mensaje que se te dio en la imagen\n\n` +
          `Con esos pasos estarás verificado para iniciar tu postulación en **Protección Civil.**`
      )
      .setThumbnail(client.user.displayAvatarURL())
      .setColor("#f5c542")
      .setFooter({
        text: "Protección Civil – MXRP",
        iconURL: client.user.displayAvatarURL(),
      });

    // Botón de inicio. customId debe ser 'iniciar'.
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("iniciar")
        .setLabel("INICIAR")
        .setStyle(ButtonStyle.Success)
    );

    await canal.send({
      embeds: [embed],
      components: [row],
    });

    // Responder con éxito (solo si las dos condiciones de error anteriores fueron false)
    await interaction.reply({
      content:
        `✅ Panel de verificación enviado correctamente al canal <#${canalId}>.`,
      ephemeral: true,
    });
  },
};