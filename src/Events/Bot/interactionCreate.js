export default {
  name: "interactionCreate",
  async execute(interaction, client) {

    // --- 1. Manejo de Comandos Slash ---
    if (interaction.isCommand()) {
      const command = client.commands.get(interaction.commandName);

      if (!command) {
        if (!interaction.replied) {
          return interaction.reply({
            content: "🚫 Este comando no está registrado.",
            ephemeral: true,
          }).catch(() => {});
        }
        return;
      }

      try {
        await command.execute(interaction, client);
      } catch (error) {
        console.error(`❌ Error al ejecutar el comando ${interaction.commandName}:`, error);
        const msg = "⚠️ Ocurrió un error al ejecutar este comando.";
        if (interaction.deferred || interaction.replied) {
          await interaction.editReply({ content: msg }).catch(() => {});
        } else {
          await interaction.reply({ content: msg, ephemeral: true }).catch(() => {});
        }
      }
    }

    // --- 2. Manejo de Botones ---
    else if (interaction.isButton()) {
      const button = client.buttons.get(interaction.customId);

      if (!button) {
        if (!interaction.replied) {
          return interaction.reply({
            content: "⚠️ Botón no encontrado o expirado.",
            ephemeral: true,
          }).catch(() => {});
        }
        return;
      }

      try {
        if (!interaction.deferred && !interaction.replied) {
          await interaction.deferReply({ ephemeral: true });
        }

        await button.execute(interaction, client);
      } catch (error) {
        console.error(`❌ Error al ejecutar botón ${interaction.customId}:`, error);
        if (interaction.deferred || interaction.replied) {
          await interaction.editReply({
            content: "⚠️ Error al ejecutar el botón.",
          }).catch(() => {});
        }
      }
    }

    // --- 3. Manejo de SelectMenus (menús desplegables) ---
    else if (interaction.isStringSelectMenu()) {
      const menu = client.selectMenus?.get(interaction.customId) || client.menus?.get(interaction.customId);

      if (!menu) {
        console.warn(`⚠️ Menú no encontrado: ${interaction.customId}`);
        return interaction.reply({
          content: "⚠️ Menú no encontrado o expirado.",
          ephemeral: true,
        }).catch(() => {});
      }

      try {
        await menu.execute(interaction, client);
      } catch (error) {
        console.error(`❌ Error ejecutando menú ${interaction.customId}:`, error);
        if (interaction.deferred || interaction.replied) {
          await interaction.editReply({ content: "⚠️ Error al ejecutar el menú." }).catch(() => {});
        } else {
          await interaction.reply({ content: "⚠️ Error al ejecutar el menú.", ephemeral: true }).catch(() => {});
        }
      }
    }
  },
};
