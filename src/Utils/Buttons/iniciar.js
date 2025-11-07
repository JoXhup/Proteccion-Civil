import {
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
} from "discord.js";

export default {
  name: "iniciar", 
  async execute(interaction, client) {
    // El deferReply se maneja en interactionCreate.js

    try {
      const member = await interaction.guild.members.fetch(interaction.user.id);

      // ⚠️ IDS DE ROLES A DAR (CAMBIAR)
      const rolesDar = [
        "1435018568394739782", // Rol 1
        "1435018581120389131", // Rol 2
        "1435018710434713691", // Rol 3
      ];

      // ⚠️ IDS DE ROLES A QUITAR (CAMBIAR)
      const rolesQuitar = [
        "1435060665541984358", // Rol no verificado 1
        "1435060713310912603", // Rol no verificado 2
      ];

      // Ejecutar todas las modificaciones de roles de forma segura
      const rolesPromises = [];
      
      for (const rol of rolesDar) {
        if (!member.roles.cache.has(rol)) { 
          rolesPromises.push(member.roles.add(rol));
        }
      }
      for (const rol of rolesQuitar) {
        if (member.roles.cache.has(rol)) {
          rolesPromises.push(member.roles.remove(rol));
        }
      }
      
      await Promise.allSettled(rolesPromises); // Espera que todas las promesas se resuelvan

      // Botón de confirmación deshabilitado
      const confirmRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("iniciar_done") 
          .setLabel("✅ Verificado")
          .setStyle(ButtonStyle.Success)
          .setDisabled(true)
      );

      // Respuesta al usuario: Usar editReply
      await interaction.editReply({
        content: `✅ ¡Has sido **verificado** correctamente, <@${interaction.user.id}>! Bienvenido a **Protección Civil – MXRP**.`,
        components: [confirmRow],
      });

      // El mensaje de log al canal público ha sido eliminado, según tu petición.

    } catch (err) {
      console.error("❌ Error al verificar usuario (Lógica de roles):", err);
      // Respuesta de error: Usar editReply
      await interaction.editReply({
        content:
          "⚠️ Ha ocurrido un error crítico al asignar roles. Revisa los permisos, la jerarquía de roles y la consola del bot.",
      }).catch(e => console.error("Fallo al enviar el error al usuario:", e));
    }
  },
};