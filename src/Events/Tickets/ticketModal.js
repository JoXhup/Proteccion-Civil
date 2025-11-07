// src/Events/Tickets/ticketModal.js
import {
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    PermissionFlagsBits,
    ChannelType,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    // Se eliminan los imports no usados para StringSelectMenu
} from "discord.js";
import { createTranscript } from "discord-html-transcripts";
// RUTA CORREGIDA (Mantén esta ruta si ticket.js está en ../../Utils/Menu/)
import { TICKET_CONFIG } from "../../Utils/Menu/ticket.js"; 


// ----------------------------------------------------------------------
// CONSTANTES GLOBALES ACTUALIZADAS (CON THUMBNAIL)
// ----------------------------------------------------------------------
const LOG_CHANNEL_ID = "1435044675026423930";
const BOT_THUMBNAIL = "https://media.discordapp.net/attachments/1435029467889139832/1435746304058851398/identidad-gobierno-federal_1.png?ex=690d1671&is=690bc4f1&hm=1de7b1a5befe16ec0b9291bbe0587962af06d18053e875359e9181144ab8e523&=&format=webp&quality=lossless&width=553&height=580";


export default {
    name: "interactionCreate",
    async execute(interaction, client) {
        const guild = interaction.guild;
        const botAvatar = client.user.displayAvatarURL();
        
        // Función para verificar si el miembro tiene *algún* rol de gestión (incluyendo permisos de admin)
        const checkTicketPermissions = (member) => {
            const allManagingRoles = [
                ...new Set(Object.values(TICKET_CONFIG).flatMap(c => c.managingRoles)),
            ];
            // Se añade la verificación de Administrador
            return allManagingRoles.some(roleId => member.roles.cache.has(roleId)) || member.permissions.has(PermissionFlagsBits.Administrator);
        };

        const sendNoPerms = (i, action) => {
            const noPermEmbed = new EmbedBuilder()
                .setTitle("🚨 Sin permisos")
                .setDescription(`No cuentas con el acceso para **${action}** el ticket.`)
                .setFooter({ text: "Protección Civil", iconURL: botAvatar })
                .setColor("Red");
            return i.reply({ embeds: [noPermEmbed], ephemeral: true });
        };
        
        // Función para crear el ticket (Se usa para el flujo de Modal)
        async function createTicketChannelFromModal(interaction, config, client, fieldValues) {
            
            // Si la interacción aún no ha sido respondida/deferred (caso Modal Submit)
            if (!interaction.deferred && !interaction.replied) {
                await interaction.deferReply({ ephemeral: true });
            }

            const userTickets = guild.channels.cache.filter((c) => c.topic === interaction.user.id);
            if (userTickets.size >= 3) {
                const maxTicketEmbed = new EmbedBuilder()
                    .setTitle("❌ Límite de tickets alcanzado")
                    .setDescription("No puedes crear más de **3** tickets abiertos.")
                    .setThumbnail(BOT_THUMBNAIL)
                    .setFooter({ text: "Protección Civil", iconURL: botAvatar })
                    .setColor("Red");
                // Usamos editReply si ya hicimos deferReply
                return interaction.editReply({ embeds: [maxTicketEmbed] }); 
            }

            const creationDate = new Date();
            const ticketNumber = Math.floor(Math.random() * 9999) + 1;
            const channelName = `${config.channelPrefix}-${ticketNumber}`;
            
            const permissionOverwrites = [
                { id: guild.id, deny: [PermissionFlagsBits.ViewChannel] },
                { id: interaction.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] },
                { id: client.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] },
            ];
            config.managingRoles.forEach(roleId => {
                permissionOverwrites.push({ 
                    id: roleId, 
                    allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] 
                });
            });

            let ticketChannel;
            try {
                ticketChannel = await guild.channels.create({
                    name: channelName,
                    type: ChannelType.GuildText,
                    parent: config.categoryId,
                    topic: interaction.user.id,
                    permissionOverwrites: permissionOverwrites,
                });
            } catch (err) {
                console.error("Error creando canal:", err);
                return interaction.editReply({ content: "❌ No se pudo crear el ticket. Revisa los permisos del bot y el ID de la categoría." });
            }
            
            // Construir el Embed principal del ticket
            const embedTitleClean = config.title.replace(/(\p{Extended_Pictographic}|\p{Emoji})/gu, '').trim();
            const embed = new EmbedBuilder()
                .setAuthor({ name: interaction.user.tag, iconURL: interaction.user.displayAvatarURL() })
                .setTitle(`${config.title} Solicitud de ticket - PC ${embedTitleClean}`)
                .addFields(
                    ...fieldValues, 
                    { name: "\u200b", value: "**📋 Información del Ticket**", inline: false }, // Se cambia a false para que separe la sección
                    { name: "**Número de Ticket:**", value: `#${ticketNumber}`, inline: false },
                    { name: "**Elemento**", value: `${interaction.user}`, inline: false },
                    { name: "**Creado:**", value: `<t:${Math.floor(creationDate.getTime() / 1000)}:F>`, inline: false },
                    { name: "**Estado:**", value: `🟡 Pendiente de Atención`, inline: false },
                )
                .setColor(Math.floor(Math.random() * 16777215)) // Color Random
                .setThumbnail(BOT_THUMBNAIL)
                .setFooter({
                    text: `Protección Civil - PC`,
                    iconURL: botAvatar
                });
            
            // Fila de botones
            const buttonRow = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId("claim_ticket")
                    .setLabel("🔓 Reclamar")
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId("close_ticket")
                    .setLabel("🔒 Cerrar Ticket")
                    .setStyle(ButtonStyle.Danger),
                new ButtonBuilder()
                    .setCustomId("add_user")
                    .setLabel("Agregar Usuario")
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId("remove_user")
                    .setLabel("Retirar Usuario")
                    .setStyle(ButtonStyle.Secondary)
            );

            const initialMessage = `Bienvenido: ${interaction.user} estas en soporte de **Protección Civil**, espera a que ${config.rolePing} lleguen para revisar tu petición.\n-# Ve presentando las pruebas necesarias para tu ticket.\n-# Ayuda a mejorar el sistema de atención en PC.`;

            await ticketChannel.send({
                content: initialMessage,
                embeds: [embed],
                components: [buttonRow],
            });

            // Mensaje de confirmación de creación (efímero) -> MODIFICADO A EMBED
            const successEmbed = new EmbedBuilder()
                .setTitle("✅ Ticket Creado Exitosamente")
                .setDescription(`Tu ticket ha sido creado en ${ticketChannel}`)
                .setThumbnail(BOT_THUMBNAIL)
                .setColor("Green")
                .setFooter({ text: "Protección Civil", iconURL: botAvatar });

            return interaction.editReply({
                embeds: [successEmbed],
            });
        }


        // ----------------------------------------------------------------------
        // Botón: Reclamar Ticket (Claim)
        // ----------------------------------------------------------------------
        
        if (interaction.isButton() && interaction.customId === "claim_ticket") {
            if (!checkTicketPermissions(interaction.member)) {
                return sendNoPerms(interaction, "reclamar");
            }
            
            await interaction.deferUpdate(); 
            
            const channel = interaction.channel;
            // Lógica de reclamar ticket (Se mantiene igual)
            // ...

            const messages = await channel.messages.fetch({ limit: 1 });
            const lastMessage = messages.first();
            if (!lastMessage || !lastMessage.embeds[0]) return interaction.followUp({ content: "❌ No se encontró el mensaje principal del ticket.", ephemeral: true });
            
            const rawEmbed = lastMessage.embeds[0];
            const embedToEdit = EmbedBuilder.from(rawEmbed);
            let estadoField = embedToEdit.data.fields?.find(f => f.name === "**Estado:**");
            
            if (estadoField && estadoField.value.includes("🟢 Reclamado")) {
                return interaction.followUp({ content: `⚠️ Este ticket ya fue reclamado por ${estadoField.value.match(/<@\d+>/)?.[0] || 'otro miembro del staff'}.`, ephemeral: true });
            }

            // 1. Actualizar el Embed con el nuevo estado
            const existingFields = embedToEdit.data.fields ?? [];
            const newFields = existingFields.map(field => {
                if (field.name === "**Estado:**") { 
                    return { ...field, value: `🟢 Reclamado por: ${interaction.user}` };
                }
                return field;
            });
            if (!estadoField) { 
                newFields.push({ name: "**Estado:**", value: `🟢 Reclamado por: ${interaction.user}`, inline: false });
            }
            embedToEdit.setFields(newFields);

            // 2. Renombrar el canal con el nombre del reclamador
            const channelNameParts = channel.name.split('-');
            const ticketNumber = channelNameParts.length > 1 ? channelNameParts[1] : '0000';
            const prefix = channelNameParts.length > 0 ? channelNameParts[0] : '';
            const claimerNameClean = interaction.member.displayName.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/gi, '').toLowerCase().substring(0, 15);
            const newChannelName = `${prefix}-${ticketNumber}-${claimerNameClean}`;
            
            await channel.setName(newChannelName).catch(e => console.error("Error al renombrar el canal:", e));


            // 3. Actualizar los botones
            const newButtonRow = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId("claim_ticket_disabled")
                    .setLabel(`✅ Reclamado por: ${interaction.member.displayName}`)
                    .setStyle(ButtonStyle.Success)
                    .setDisabled(true), 
                new ButtonBuilder()
                    .setCustomId("close_ticket")
                    .setLabel("🔒 Cerrar Ticket")
                    .setStyle(ButtonStyle.Danger),
                new ButtonBuilder()
                    .setCustomId("add_user")
                    .setLabel("Agregar Usuario")
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId("remove_user")
                    .setLabel("Retirar Usuario")
                    .setStyle(ButtonStyle.Secondary)
            );
            
            // 4. Actualizar el mensaje
            await lastMessage.edit({
                embeds: [embedToEdit],
                components: [newButtonRow], 
            }).catch(e => console.error("Error al editar el mensaje principal del ticket:", e));

            return interaction.followUp({ content: `✅ Has reclamado este ticket.`, ephemeral: true });
        }
        
        // ----------------------------------------------------------------------
        // Botón: Cerrar Ticket (MUESTRA EL MODAL)
        // ----------------------------------------------------------------------
        if (interaction.isButton() && interaction.customId === "close_ticket") {
            if (!checkTicketPermissions(interaction.member)) {
                return sendNoPerms(interaction, "cerrar");
            }
            
            // Construcción del Modal de Cierre
            const modal = new ModalBuilder()
                .setCustomId(`close_ticket_modal_${interaction.channel.id}`)
                .setTitle("🔒 Cierre de Ticket - PC");

            const reasonInput = new TextInputBuilder()
                .setCustomId("close_reason")
                .setLabel("Razón del Cierre")
                .setStyle(TextInputStyle.Paragraph)
                .setPlaceholder("Ej: Solicitud resuelta, inactividad, duplicado, spam.")
                .setRequired(true);

            modal.addComponents(new ActionRowBuilder().addComponents(reasonInput));
            
            // Muestra el modal
            return interaction.showModal(modal);
        }
        
        // ----------------------------------------------------------------------
        // Botones: Agregar/Retirar Usuario (MUESTRA EL MODAL)
        // ----------------------------------------------------------------------

        if (interaction.isButton() && ["add_user", "remove_user"].includes(interaction.customId)) {
            if (!checkTicketPermissions(interaction.member)) {
                return sendNoPerms(interaction, interaction.customId === "add_user" ? "agregar usuarios a" : "retirar usuarios de");
            }
            const modal = new ModalBuilder()
                .setCustomId(`${interaction.customId}_modal_${interaction.channel.id}`)
                .setTitle(interaction.customId === "add_user" ? "Agregar Usuario al Ticket" : "Retirar Usuario del Ticket");

            const userIdInput = new TextInputBuilder()
                .setCustomId("user_id")
                .setLabel("Ingresa el ID del usuario")
                .setStyle(TextInputStyle.Short)
                .setPlaceholder("Ejemplo: 123456789012345678")
                .setRequired(true);

            modal.addComponents(new ActionRowBuilder().addComponents(userIdInput));
            return interaction.showModal(modal);
        }
        
        // ----------------------------------------------------------------------
        // Manejo de Modals Submit
        // ----------------------------------------------------------------------
        
        if (interaction.isModalSubmit()) {
            
            // ----------------------------------------------------------------------
            // Modal: Cierre de Ticket (SUBMIT DE CIERRE)
            // ----------------------------------------------------------------------
            if (interaction.customId.startsWith("close_ticket_modal_")) {
                await interaction.deferReply({ ephemeral: true }); // Respuesta efímera para el que cierra
                
                const channelId = interaction.customId.replace("close_ticket_modal_", "");
                const channel = guild.channels.cache.get(channelId);
                const logChannel = guild.channels.cache.get(LOG_CHANNEL_ID); 
                
                if (!channel) {
                    const errorEmbed = new EmbedBuilder()
                        .setTitle("❌ Error de Cierre")
                        .setDescription("Canal no encontrado o ya fue cerrado.")
                        .setThumbnail(BOT_THUMBNAIL)
                        .setColor("Red")
                        .setFooter({ text: "Protección Civil", iconURL: botAvatar });
                    return interaction.editReply({ embeds: [errorEmbed] });
                }

                const closeReason = interaction.fields.getTextInputValue("close_reason");
                const ticketCreatorId = channel.topic; 
                const ticketCreator = ticketCreatorId ? await guild.members.fetch(ticketCreatorId).catch(() => null) : null;
                const closeDate = new Date();


                // 1. Enviar mensaje de cierre en el ticket (visible para todos)
                await channel.send({ content: `🔒 Ticket cerrado por **${interaction.user.tag}** (${interaction.user}). Generando transcripción...` });
                
                // 2. Modificar permisos
                await channel.permissionOverwrites.edit(guild.id, { SendMessages: false });
                if (ticketCreator) {
                    await channel.permissionOverwrites.edit(ticketCreator.id, { ViewChannel: true, SendMessages: false }).catch(() => {});
                }

                // 3. Generar transcripción
                const transcriptFile = await createTranscript(channel, {
                    limit: -1, filename: `${channel.name}-transcripcion.html`,
                }).catch(() => null);
                
                // 4. Embed para el Canal de Logs (MEJORADO)
                const logEmbed = new EmbedBuilder()
                    .setTitle("🚨 Bitácora de Cierre: Ticket Finalizado")
                    .setColor(0xD62C1A) // Rojo fuerte, más "chingón"
                    .setAuthor({ name: `Ticket Cerrado por: ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() })
                    .setThumbnail(BOT_THUMBNAIL)
                    .addFields(
                        { name: "Canal", value: `<#${channel.id}> (\`#${channel.name}\`)`, inline: true },
                        { name: "Elemento (Creador)", value: ticketCreator ? `${ticketCreator.user.tag}` : `Desconocido`, inline: true },
                        { name: "Gestor de Cierre", value: `${interaction.user}`, inline: true },
                        { name: "Razón del Cierre", value: `\`\`\`${closeReason}\`\`\``, inline: true }
                    )
                    .setTimestamp(closeDate)
                    .setFooter({ text: `Protección Civil - PC | ID: ${channel.id}`, iconURL: botAvatar });
                
                const logAttachments = transcriptFile ? [transcriptFile] : [];

                if (logChannel) {
                    await logChannel.send({ embeds: [logEmbed], files: logAttachments }).catch(e => console.error("Error enviando log:", e));
                }

                // 5. Mensaje Privado al Creador del Ticket (MEJORADO)
                if (ticketCreator) {
                    const privateEmbed = new EmbedBuilder()
                        .setTitle("📝 Tu Ticket Ha Sido Cerrado - PC")
                        .setDescription(`El ticket **#${channel.name}** ha sido **cerrado** y finalizado por el Staff de **Protección Civil**.`)
                        .addFields(
                            { name: "Gestor", value: `${interaction.user.tag}`, inline: true },
                            { name: "Razón", value: `\`${closeReason}\``, inline: true }
                        )
                        .setColor(0xCD0000)
                        .setTimestamp(closeDate)
                        .setThumbnail(BOT_THUMBNAIL)
                        .setFooter({ text: "Gracias por tu colaboración.", iconURL: botAvatar });

                    await ticketCreator.send({ embeds: [privateEmbed], files: logAttachments }).catch(() => console.log(`No se pudo enviar el DM a ${ticketCreator.user.tag}.`));
                }
                
                // 6. Mensaje efímero de confirmación para el Staff -> MODIFICADO A EMBED
                const closeSuccessEmbed = new EmbedBuilder()
                    .setTitle("✅ Ticket Cerrado Exitosamente")
                    .setDescription(`El ticket \`#${channel.name}\` ha sido cerrado.\nLogs enviados. El canal se eliminará en **5 segundos**.`)
                    .setThumbnail(BOT_THUMBNAIL)
                    .setColor("Orange")
                    .setFooter({ text: "Protección Civil", iconURL: botAvatar });

                await interaction.editReply({ embeds: [closeSuccessEmbed] });

                // 7. Eliminación del canal
                setTimeout(() => { channel.delete().catch(console.error); }, 5000);
                return;
            }

            // ----------------------------------------------------------------------
            // Modal: Creación de Ticket (SUBMIT)
            // ----------------------------------------------------------------------
            if (interaction.customId.startsWith("ticket_modal_")) {
                // Lógica de Creación de Ticket desde Modal (usando la función arriba)
                // El deferReply se maneja dentro de createTicketChannelFromModal
                const categoryType = interaction.customId.replace("ticket_modal_", "");
                const config = TICKET_CONFIG[categoryType];
                if (!config) return interaction.reply({ content: "⚠️ Configuración de modal no encontrada.", ephemeral: true });

                const fieldValues = config.fields.map((f) => {
                    const value = interaction.fields.getTextInputValue(f.id) || "No especificada";
                    // Asegura que los campos del embed de creación contengan la info del modal
                    const name = `**${f.label.replace(':', '').trim()}:**`;
                    return { name: name, value: value, inline: false };
                });
                
                return createTicketChannelFromModal(interaction, config, client, fieldValues);
            }
            
            // Lógica de Modals para Agregar/Retirar Usuario... (se mantiene)
            if (interaction.customId.startsWith("add_user_modal_") || interaction.customId.startsWith("remove_user_modal_")) {
                 await interaction.deferReply({ ephemeral: true });
                const channelId = interaction.customId.split('_').pop();
                const channel = guild.channels.cache.get(channelId);
                const userId = interaction.fields.getTextInputValue("user_id");
                const member = await guild.members.fetch(userId).catch(() => null); 

                if (!channel || !member) return interaction.editReply({ content: "❌ Canal o Usuario no encontrado." });
                if (channel.topic === member.id && interaction.customId.startsWith("remove_user_modal_")) {
                    return interaction.editReply({ content: "⚠️ No puedes retirar al creador del ticket." });
                }

                try {
                    if (interaction.customId.startsWith("add_user_modal_")) {
                        await channel.permissionOverwrites.edit(member.id, { ViewChannel: true, SendMessages: true, ReadMessageHistory: true });
                        const embed = new EmbedBuilder().setColor("Green").setTitle("✅ Usuario Agregado").setDescription(`**${member.user.tag}** ha sido **agregado** por ${interaction.user}.`).setFooter({ text: "Protección Civil", iconURL: botAvatar });
                        await channel.send({ embeds: [embed], content: `${member}` });
                        return interaction.editReply({ content: "Usuario agregado correctamente." });
                    } else {
                        await channel.permissionOverwrites.delete(member.id);
                        const embed = new EmbedBuilder().setColor("Red").setTitle("🛑 Usuario Retirado").setDescription(`**${member.user.tag}** ha sido **retirado** por ${interaction.user}.`).setFooter({ text: "Protección Civil", iconURL: botAvatar });
                        await channel.send({ embeds: [embed] });
                        return interaction.editReply({ content: "Usuario retirado correctamente." });
                    }
                } catch (e) {
                    console.error("Error al modificar permisos:", e);
                    return interaction.editReply({ content: "❌ Error al modificar permisos del canal." });
                }
            }
        }
    },
};