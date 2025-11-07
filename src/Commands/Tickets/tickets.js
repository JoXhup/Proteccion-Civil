// src/Commands/Tickets/tickets.js
import {
    SlashCommandBuilder,
    ActionRowBuilder,
    StringSelectMenuBuilder,
    EmbedBuilder,
} from "discord.js";
// 💡 Importar la configuración centralizada de tickets
import { TICKET_CONFIG } from "../../Utils/Menus/ticket.js";

export const data = new SlashCommandBuilder()
    .setName("tickets")
    .setDescription("🎫 Envía el panel de tickets");

export async function execute(interaction) {
    // ID del canal donde se enviará el panel, actualizado
    const PANEL_CHANNEL_ID = "1435033685882703914"; 

    if (!interaction.member.permissions.has("Administrator")) {
         return interaction.reply({
             content: "❌ Solo los administradores pueden enviar el panel de tickets.",
             ephemeral: true,
         });
    }

    const canalTickets = interaction.guild.channels.cache.get(PANEL_CHANNEL_ID);
    if (!canalTickets)
        return interaction.reply({
            content: "❌ No se encontró el canal de tickets (ID: 1435033685882703914). Asegúrate de que el ID sea correcto.",
            ephemeral: true,
        });

    const embed = new EmbedBuilder()
        .setAuthor({
            name: "Soporte | Protección Civil",
            iconURL: interaction.client.user.displayAvatarURL(),
        })
        .setDescription(
            "```ansi\n\u001b[34m Panel de Tickets| Centro de Apoyo PC\u001b[0m```\n" +
            "**📋 Instrucciones Importantes:**\n" +
            "• Revisa las categorías disponibles antes de crear tu ticket.\n" +
            "• Proporciona toda la información necesaria para agilizar el proceso.\n" +
            "• Mantén un comportamiento respetuoso en todo momento.\n" +
            "• Las pruebas son fundamentales para reportes.\n" +
            "• Un encargado de ticket responderá tu solicitud.\n\n" +
            "```ansi\n\u001b[34m Políticas de Uso\u001b[0m```\n" +
            "⚠️ El uso indebido del sistema resultará en sanciones.\n" +
            "📊 Tiempo promedio de respuesta: `1 a 12 horas.`\n" +
            "🔒 Toda la información es tratada de forma confidencial.\n\n" +
            "Este es el panel de Soporte de la **Secretaría de Protección Civil - [MXRP]** , en el cual podrás pedir ayuda mediante un ticket que será revisado por uno de nuestros encargados.\n\n" +
            "```ansi\n\u001b[34m ¿Cómo funciona?\u001b[0m```\n\n" +
            "1️. En el *menú* de abajo, selecciona la opción que más se acerque a tu solicitud.\n" +
            "2️. Si se te pide, rellena el formulario con la información necesaria.\n" +
            "3️. El Bot te abrirá un canal privado para tu ticket.\n" +
            "4️. Espera a que un gestor lo atienda y menciona tu problema.\n\n" +
            "**Selecciona una opción en el menú de abajo para abrir un ticket:**\n\n" +
            "**PROTECCIÓN CIVIL**"
        )
        .setColor("#002a61")
        .setThumbnail(interaction.client.user.displayAvatarURL())
        .setFooter({
            text: "Protección Civil - [MXRP]",
            iconURL: interaction.client.user.displayAvatarURL(),
        })
        .setImage(
            "https://media.discordapp.net/attachments/1435033685882703914/1435397874967122001/identidad-gobierno-federal_1.png?ex=690bd1f1&is=690a8071&hm=27a81720166b29cd8bf45c1f417618d21a06d15a07c160d0df0c5234facc39e4&=&format=webp&quality=lossless&width=810&height=810"
        );

    // Generar opciones dinámicamente desde TICKET_CONFIG
    const menuOptions = Object.entries(TICKET_CONFIG).map(([key, config]) => {
        const emojiMatch = config.title.match(/^(\p{Extended_Pictographic}|\p{Emoji})*/u);
        const emoji = emojiMatch ? emojiMatch[0].trim() : null;

        return {
            label: config.title, 
            description: config.description,
            value: key,
            emoji: emoji,
        };
    });

    const menu = new StringSelectMenuBuilder()
        .setCustomId("ticket")
        .setPlaceholder("🔍 Selecciona un tipo de ticket que necesites")
        .addOptions(menuOptions);

    const row = new ActionRowBuilder().addComponents(menu);

    await canalTickets.send({ embeds: [embed], components: [row] });
    await interaction.reply({
        content: `✅ Panel de tickets enviado correctamente en ${canalTickets}.`,
        ephemeral: true,
    });
}