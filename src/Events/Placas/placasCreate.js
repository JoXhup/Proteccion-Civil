import {
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    ActionRowBuilder,
    EmbedBuilder,
    PermissionFlagsBits, // Aún se importa, pero ya no se usa para la verificación
} from "discord.js";

export default {
    name: "interactionCreate",
    async execute(interaction, client) {
        
        try { 
            if (!interaction.inGuild()) return;

            const THUMB = interaction.guild.iconURL() || client.user.displayAvatarURL();
            
            // --- IDs Centralizadas ---
            const ROL_AUTORIZADO = "1435016989474295908"; // ROL REQUERIDO (Cúpula Administrativa)
            const SOLICITUD_CANAL_LINK = "1435033685882703914"; 
            const ROL_MENCION_PC = "1435019080318062692"; 
            const SERVIDOR_ID = "1435010305536299040"; 
            // -------------------------------------------------------------------
            
            // ----------------------------------------------------------
            // 1. GESTIÓN DEL BOTÓN DE EDICIÓN
            // ----------------------------------------------------------

            if (interaction.isButton() && interaction.customId.startsWith("placas_edit_")) {
                
                // 1.1 Verificación de Permisos
                
                // Fetch Member para obtener los roles actualizados
                const member = await interaction.guild.members.fetch(interaction.user.id);
                
                const esAutorizado = member.roles.cache.has(ROL_AUTORIZADO);
                
                // 🛑 Lógica de control de acceso: Solo verifica el ROL_AUTORIZADO.
                // Ignora si es Administrador o tiene otros permisos.
                if (!esAutorizado) { 
                    const error = new EmbedBuilder()
                        .setColor("Red")
                        .setTitle("⛔ Acceso Restringido")
                        .setDescription(`No eres parte de la **Cúpula Administrativa** de Protección Civil. Solo los miembros con el rol específico (<@&${ROL_AUTORIZADO}>) pueden editar este panel.`)
                        .setThumbnail(THUMB);
                    
                    return await interaction.reply({ embeds: [error], ephemeral: true });
                }

                // 1.2 Extracción del Contenido (Continúa si el rol es correcto)
                const embedExistente = interaction.message.embeds[0];
                if (!embedExistente || !embedExistente.description) {
                    return interaction.reply({ content: "Error: No se encontró el embed o la descripción.", ephemeral: true });
                }

                const footerSeparador = '-------------';
                const partesDescripcion = embedExistente.description.split(footerSeparador);
                const textoPlacasEditable = partesDescripcion[0] ? partesDescripcion[0].trim() : '';

                // 1.3 Creación del Modal
                const modal = new ModalBuilder()
                    .setCustomId(`placas_modal_${interaction.message.id}`)
                    .setTitle(`Editar placas (${embedExistente.title || 'Panel PC'})`);

                const input = new TextInputBuilder()
                    .setCustomId("nuevo_texto_placas")
                    .setLabel("Editar lista de placas (Formato: PC-8XX:)") 
                    .setStyle(TextInputStyle.Paragraph)
                    .setRequired(true)
                    .setValue(textoPlacasEditable);

                const row = new ActionRowBuilder().addComponents(input);
                modal.addComponents(row);

                return await interaction.showModal(modal);
            }

            // ----------------------------------------------------------
            // 2. GESTIÓN DEL MODAL SUBMIT (Edición de Contenido)
            // ----------------------------------------------------------

            if (interaction.isModalSubmit() && interaction.customId.startsWith("placas_modal_")) {
                const nuevoTextoPlacas = interaction.fields.getTextInputValue("nuevo_texto_placas");
                const messageId = interaction.customId.split("_").at(-1);
                const canal = interaction.channel;

                await interaction.deferReply({ ephemeral: true });

                if (!canal || !canal.isTextBased()) {
                    const error = new EmbedBuilder().setColor("Red").setTitle("🚨 Error de Canal").setDescription("No se pudo obtener el canal para editar el mensaje").setThumbnail(THUMB);
                    return await interaction.editReply({ embeds: [error] });
                }

                try {
                    const mensaje = await canal.messages.fetch(messageId);
                    const embedExistente = mensaje.embeds[0];
                    if (!embedExistente) throw new Error("Mensaje no contiene embed");

                    const enlaceSolicitudes = `https://ptb.discord.com/channels/${SERVIDOR_ID}/${SOLICITUD_CANAL_LINK}`;
                    const footerLargoFijo = `
-------------
Elementos, en caso de no tener una placa oh presentar algún problema en su proceso de ingreso, dirígete a este canal:
> ${enlaceSolicitudes}
Ahí se les brindara la atención necesaria para sus problemas & quejas en **Protección Civil** <@&${ROL_MENCION_PC}>`;
                    
                    const nuevaDescripcionCompleta = `${nuevoTextoPlacas.trim()}\n\n${footerLargoFijo}`;

                    const embedEditado = EmbedBuilder.from(embedExistente)
                        .setDescription(nuevaDescripcionCompleta)
                        .setFooter({ text: 'Placas PC | MXRP' }); 

                    await mensaje.edit({ embeds: [embedEditado], components: mensaje.components });

                    const confirm = new EmbedBuilder()
                        .setColor("#4caf50")
                        .setTitle("✅ El panel de placas fue editado correctamente")
                        .setThumbnail(THUMB);

                    return await interaction.editReply({ embeds: [confirm] });
                } catch (error) {
                    console.error("Error al editar mensaje vía modal:", error);
                    const errEmbed = new EmbedBuilder()
                        .setColor("Red")
                        .setTitle("🚨 Error al editar el mensaje")
                        .setDescription("No se pudo encontrar o editar el mensaje. Consulta la consola.")
                        .setThumbnail(THUMB);
                    return await interaction.editReply({ embeds: [errEmbed] });
                }
            }
            
        } catch (errorGeneral) {
            console.error("Error general en interactionCreate:", errorGeneral);
            if (interaction.isRepliable() && !interaction.replied && !interaction.deferred) {
                const errEmbed = new EmbedBuilder().setColor("Red").setTitle("🚨 Ocurrió un error inesperado").setDescription("Por favor intenta de nuevo más tarde.");
                try {
                    await interaction.reply({ embeds: [errEmbed], ephemeral: true });
                } catch {}
            }
        }
    },
};