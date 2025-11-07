// src/Utils/Menu/ticket.js
import {
    ActionRowBuilder,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    EmbedBuilder, 
    ChannelType, 
    PermissionFlagsBits, 
    ButtonBuilder,
    ButtonStyle,
} from "discord.js";

// ----------------------------------------------------------------------
// CONFIGURACIÓN CENTRALIZADA DE TICKETS
// ----------------------------------------------------------------------

export const TICKET_CONFIG = {
    // NOTA: Asegúrate de que todas las categoryId existan en tu servidor
    otros: {
        title: "➕ Otros",
        description: "Temas fuera de las demás categorias disponibles",
        categoryId: "1435389966367719576",
        rolePing: "<@&1435016724184432771>", // Ping para el mensaje
        managingRoles: ["1435016724184432771"], // Roles para permisos
        channelPrefix: "➕ticket",
        fields: [
            { id: "detalles", label: "Detalles de la solicitud", placeholder: "Describe brevemente que es lo que solicitas.", style: TextInputStyle.Paragraph, required: true },
        ],
    },
    dudas: {
        title: "❓ Dudas / Preguntas",
        description: "Alguna duda y/o problema",
        categoryId: "1435044442246742056",
        rolePing: "<@&1435016724184432771>",
        managingRoles: ["1435016724184432771"],
        channelPrefix: "❓ticket",
        fields: [], // Sin modal, apertura directa
    },
    reportes: {
        title: "💢 Reportes",
        description: "Reporte hacia elementos en tema IC",
        categoryId: "1435389758434967734",
        rolePing: "<@&1435016724184432771>",
        managingRoles: ["1435016724184432771"],
        channelPrefix: "💢ticket",
        fields: [
            { id: "tipo_reporte", label: "Tipo de reporte", placeholder: "Reporte elementario", style: TextInputStyle.Short, required: true },
            { id: "pruebas", label: "¿Tiene pruebas de lo sucedido?", placeholder: "Si / No", style: TextInputStyle.Short, required: true },
            { id: "detalles", label: "Detalles", placeholder: "Sucedio en pleno rol en LC", style: TextInputStyle.Paragraph, required: true },
        ],
    },
    mxrp_staff: {
        title: "📝 MXRP STAFF",
        description: "Cualquier detalle relacionado al staff de mxrp",
        categoryId: "1435389885530771476",
        rolePing: "<@&1435019489098858648>",
        managingRoles: ["1435019489098858648"],
        channelPrefix: "📝ticket",
        fields: [
            { id: "pertenece", label: "¿Pertenece a la Administracion MXRP?", placeholder: "Si / No", style: TextInputStyle.Short, required: true },
            { id: "rango", label: "Rango", placeholder: "Lead Developer / Oficina de Administración", style: TextInputStyle.Short, required: true },
            { id: "solicita", label: "¿Por qué los solicita?", placeholder: "Vengo de parte de DR MXRP", style: TextInputStyle.Paragraph, required: true },
        ],
    },
    servicios: {
        title: "🌐 Servicios",
        description: "Todo lo relacionado a los servicios exclusivos de la PC",
        categoryId: "1435390459970064534",
        rolePing: "<@&1435019489098858648>",
        managingRoles: ["1435019489098858648"],
        channelPrefix: "🌐ticket",
        fields: [], // Sin modal, apertura directa
    },
    faccionarios: {
        title: "💼 Faccionarios",
        description: "Temas sobre la faccion, alianzas, reportes",
        categoryId: "1435389857986904305",
        rolePing: "<@&1435016724184432771>",
        managingRoles: ["1435016724184432771"],
        channelPrefix: "💼ticket",
        fields: [
            { id: "detalles", label: "Detalles", placeholder: "Vengo para realizar una alianza (@SSPC)", style: TextInputStyle.Paragraph, required: true },
        ],
    },
    solicitar_rango: {
        title: "👑 Solicitar Rango",
        description: "Solicita un rol dentro de la protección civil mexicana",
        categoryId: "1435389807588278384",
        rolePing: "<@&1435016724184432771>",
        managingRoles: ["1435016724184432771"],
        channelPrefix: "👑ticket",
        fields: [
            { id: "rango", label: "Rango", placeholder: "Arconte", style: TextInputStyle.Short, required: true },
            { id: "motivo", label: "Motivo", placeholder: "Ese es mi rango en la PC", style: TextInputStyle.Paragraph, required: true },
        ],
    },
    soporte_tecnico: {
        title: "🔧 Soporte Técnico",
        description: "Temas sobre errores/bugs del BOT y Discord",
        categoryId: "1435390255963439236",
        rolePing: "<@&1435394209757794477>",
        managingRoles: ["1435394209757794477"],
        channelPrefix: "🔧ticket",
        fields: [
            { id: "descripcion", label: "Descripción", placeholder: "Detalla específicamente el error que se presento", style: TextInputStyle.Paragraph, required: true },
        ],
    },
    soporte_prioritario: {
        title: "🔔 Soporte Prioritario",
        description: "Ticket para los elementos VIP de la facción",
        categoryId: "1435389927738314887",
        rolePing: "<@&1435011133898620990> y <@&1435011300278276288>", // Para mensaje de ping
        managingRoles: ["1435011133898620990", "1435011300278276288"],
        channelPrefix: "🔔ticket",
        fields: [], // Sin modal, apertura directa
    },
    reporte_comite: {
        title: "🚨 Reporte COMITÉ ADMINISTRATIVO",
        description: "Realiza un reporte hacía un elemento de alta dirección",
        categoryId: "1435390368530305116",
        rolePing: "<@&1435011133898620990> y <@&1435011300278276288>", // Para mensaje de ping
        managingRoles: ["1435011133898620990", "1435011300278276288"],
        channelPrefix: "🚨ticket",
        fields: [
            { id: "comite_reportado", label: "Comité Administrativo reportado", placeholder: "Coloca el usuario al que reportas (ej: @nick)", style: TextInputStyle.Short, required: true },
            { id: "detalles", label: "Detalles", placeholder: "Da una breve explicación de lo sucedido", style: TextInputStyle.Paragraph, required: true },
        ],
    },
};

// ----------------------------------------------------------------------
// LÓGICA DE CREACIÓN DE TICKET (Para tickets sin modal)
// ----------------------------------------------------------------------

async function createTicketChannel(interaction, config, client, fieldValues = []) {
    const guild = interaction.guild;
    // La URL del Avatar del Bot
    const botAvatar = client.user.displayAvatarURL(); 
    const creationDate = new Date();
    
    // Miniatura estática (se mantiene por si deseas usarla en otro lugar, pero no se usará en setThumbnail)
    const BOT_THUMBNAIL_URL = "https://media.discordapp.net/attachments/1435033685882703914/1435397874967122001/identidad-gobierno-federal_1.png?ex=690bd1f1&is=690a8071&hm=27a81720166b29cd8bf45c1f417618d21a06d15a07c160d0df0c5234facc39e4&=&format=webp&quality=lossless&width=553&height=580";

    // Límite de tickets
    const userTickets = guild.channels.cache.filter((c) => c.topic === interaction.user.id);
    if (userTickets.size >= 3) {
        const maxTicketEmbed = new EmbedBuilder()
            .setTitle("❌ Límite de tickets alcanzado")
            .setDescription("No puedes crear más de **3** tickets abiertos.")
            // >> AHORA USA EL AVATAR DEL BOT COMO MINIATURA <<
            .setThumbnail(botAvatar) 
            .setFooter({ text: "Protección Civil", iconURL: botAvatar }) 
            .setColor("Red");
        return interaction.editReply({ embeds: [maxTicketEmbed] }); 
    }

    const ticketNumber = Math.floor(Math.random() * 9999) + 1;
    const channelName = `${config.channelPrefix}-${ticketNumber}`;
    
    // Preparar la lista de permisos
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
            topic: interaction.user.id, // ID del creador
            permissionOverwrites: permissionOverwrites,
        });
    } catch (err) {
        console.error("Error creando canal:", err);
        return interaction.editReply({ content: "❌ No se pudo crear el ticket. Revisa los permisos del bot y el ID de la categoría." });
    }
    
    // Contenido del Embed para el canal del ticket
    const embedTitleClean = config.title.replace(/(\p{Extended_Pictographic}|\p{Emoji})/gu, '').trim();
    
    // Generar campos: Si no hay campos del modal, se añade uno genérico
    const fieldsForChannel = fieldValues.length > 0 ? fieldValues : [
        { name: "**Detalles de la Solicitud:**", value: "Apertura directa. Por favor, proporciona todos los detalles necesarios a continuación.", inline: false }
    ];

    const embed = new EmbedBuilder()
        .setAuthor({ name: interaction.user.tag, iconURL: interaction.user.displayAvatarURL() })
        .setTitle(`${config.title} Solicitud de ticket - PC ${embedTitleClean}`)
        .addFields(
            ...fieldsForChannel,
            { name: "\u200b", value: "**📋 Información del Ticket**", inline: false },
            { name: "**Número de Ticket:**", value: `#${ticketNumber}`, inline: false },
            { name: "**Elemento**", value: `${interaction.user}`, inline: false },
            { name: "**Creado:**", value: `<t:${Math.floor(creationDate.getTime() / 1000)}:F>`, inline: false },
            { name: "**Estado:**", value: `🟡 Pendiente de Atención`, inline: false },
        )
        .setColor(Math.floor(Math.random() * 16777215)) // Color Random
        // >> AHORA USA EL AVATAR DEL BOT COMO MINIATURA <<
        .setThumbnail(botAvatar) 
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

    // Mensaje inicial del ticket
    const initialMessage = `Bienvenido: ${interaction.user} estas en soporte de **Protección Civil**, espera a que ${config.rolePing} lleguen para revisar tu petición.\n-# Ve presentando las pruebas necesarias para tu ticket.\n-# Ayuda a mejorar el sistema de atención en PC.`;

    await ticketChannel.send({
        content: initialMessage,
        embeds: [embed],
        components: [buttonRow],
    });

    // Mensaje de confirmación de creación (efímero)
    const successEmbed = new EmbedBuilder()
        .setTitle("✅ Ticket Creado Exitosamente")
        .setDescription(`Tu ticket ha sido creado en ${ticketChannel}`)
        // >> AHORA USA EL AVATAR DEL BOT COMO MINIATURA <<
        .setThumbnail(botAvatar) 
        .setColor("Green")
        .setFooter({ text: "Protección Civil", iconURL: botAvatar }); 

    return interaction.editReply({
        embeds: [successEmbed],
    });
}

// ----------------------------------------------------------------------
// LÓGICA DEL SELECT MENU HANDLER
// ----------------------------------------------------------------------

export default {
    name: "ticket",

    async execute(interaction, client) {
        const selected = interaction.values[0];
        const config = TICKET_CONFIG[selected];

        if (!config) {
            return interaction.reply({
                content: "⚠️ Categoría no reconocida.",
                ephemeral: true,
            });
        }
        
        // --- Lógica para tickets con modal (fields > 0) ---
        if (config.fields && config.fields.length > 0) {
            const modal = new ModalBuilder()
                .setCustomId(`ticket_modal_${selected}`)
                .setTitle(config.title);

            // Crea y añade los campos de texto al modal
            config.fields.forEach(fieldConfig => {
                const input = new TextInputBuilder()
                    .setCustomId(fieldConfig.id)
                    .setLabel(fieldConfig.label)
                    .setStyle(fieldConfig.style)
                    .setPlaceholder(fieldConfig.placeholder)
                    .setRequired(fieldConfig.required);

                modal.addComponents(new ActionRowBuilder().addComponents(input));
            });

            return interaction.showModal(modal);
        } 
        
        // --- Lógica para tickets sin modal (Apertura Directa) ---
        else {
            // Es crucial hacer deferReply ANTES de cualquier lógica de creación de canal
            await interaction.deferReply({ ephemeral: true });
            
            // Llamar a la función de creación con valores de campo vacíos
            return createTicketChannel(interaction, config, client);
        }
    },
};