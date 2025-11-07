import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
} from "discord.js";

// --- CONFIGURACIÓN DE IDs (ACTUALIZADAS PARA PC) ---
const ID_CANAL_ENVIO = "1435034917909172426"; // Canal donde se envía el embed
const ROL_AUTORIZADO = "1435016989474295908"; // Rol autorizado para usar /placas-setup y editar el panel
const SOLICITUD_CANAL_LINK = "1435033685882703914"; // ID del canal de Quejas/Solicitudes (para el enlace)
const ROL_MENCION_PC = "1435019080318062692"; // Rol a mencionar al final del embed.
const SERVIDOR_ID = "1435010305536299040"; // ID del Servidor (Necesario para construir el enlace del canal)
// ---------------------------------------------

// Función para generar la lista de placas de manera eficiente
function generarPlacas(inicio, fin) {
    let placas = '';
    for (let i = inicio; i <= fin; i++) {
        placas += `**PC-${i}:**\n`;
    }
    return placas.trim();
}

// ✅ DATOS DEL PANEL DE PROTECCIÓN CIVIL (PC)
const PLACAS_PC = {
  TITULO: "PROTECCIÓN CIVIL MÉXICANA",
  COLOR: "#96142c", 
  DESCRIPCION: `
# [----《ALTO MANDO》----]
**PC-800:**
**PC-801:**
**PC-802:**

# [----《SUB JEFATURA》----]
**PC-803:**
**PC-804:**
**PC-805:**
**PC-806:**
**PC-807:**

# [----《INTENDENCIA》----]
**PC-808:**
**PC-809:**
**PC-810:**
**PC-811:**
**PC-812:**

# [----《JEFES》----]
${generarPlacas(813, 814)}

# [----《COMANDANCIA》----]
${generarPlacas(815, 825)}

# [----《BASE DE MANDO》----]
${generarPlacas(826, 835)}

# [----《BASE OPERATIVA》----]
${generarPlacas(836, 899)}
    `,
};
// ---------------------------------------------

/**
 * Función para generar y enviar el embed de placas de PC
 */
async function enviarPanelPlacas(
  canal,
  data,
  thumbnail,
) {
  const { TITULO, DESCRIPCION, COLOR } = data;
  
  // Enlace completo al canal de solicitudes
  const enlaceSolicitudes = `https://ptb.discord.com/channels/${SERVIDOR_ID}/${SOLICITUD_CANAL_LINK}`;
  
  // Se crea la descripción final incluyendo el formato solicitado
  const descripcionFinal = `${DESCRIPCION}\n\n-------------
Elementos, en caso de no tener una placa oh presentar algún problema en su proceso de ingreso, dirígete a este canal:
> ${enlaceSolicitudes}
Ahí se les brindara la atención necesaria para sus problemas & quejas en **Protección Civil** <@&${ROL_MENCION_PC}>`;


  const embed = new EmbedBuilder()
    .setColor(COLOR)
    .setTitle(TITULO)
    .setDescription(descripcionFinal)
    .setThumbnail(thumbnail)
    // ✅ Footer simple que solicitaste
    .setFooter({ text: 'Placas PC | MXRP' }); 

  // Botón de Edición (customId se usa luego en interactionCreate.js)
  const boton = new ButtonBuilder()
    .setCustomId(`placas_edit_${TITULO.replace(/\s/g, "_")}`) 
    .setStyle(ButtonStyle.Success)
    .setLabel("✍🏼 Editar");

  const row = new ActionRowBuilder().addComponents(boton);
  
  const mensajeEnviado = await canal.send({ embeds: [embed], components: [row] });
  return mensajeEnviado.id;
}


export default {
  data: new SlashCommandBuilder()
    .setName("placas-setup-pc") 
    .setDescription("✍🏼 Configura el mensaje embed inicial de placas de Protección Civil.")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction, client) {
    const THUMB = interaction.client.user.displayAvatarURL({ dynamic: true, size: 256 });

    // --- Verificación de permisos (Doble check) ---
    const esAutorizado = interaction.member.roles.cache.has(ROL_AUTORIZADO);
    const esAdmin = interaction.member.permissions.has(PermissionFlagsBits.Administrator);

    if (!esAutorizado && !esAdmin) {
      const errorEmbed = new EmbedBuilder()
        .setColor("Red")
        .setTitle("🚨 No tienes permisos para usar este comando")
        .setDescription(`Se requiere el rol <@&${ROL_AUTORIZADO}> o permisos de Administrador.`)
        .setThumbnail(THUMB);
      return interaction.reply({ embeds: [errorEmbed], flags: 64 });
    }

    // --- Verificación del canal ---
    const canal = await client.channels.fetch(ID_CANAL_ENVIO).catch(() => null);
    if (!canal) {
      const errorEmbed = new EmbedBuilder()
        .setColor("Red")
        .setTitle("🚫 No se pudo encontrar el canal de placas")
        .setDescription(`Verifica que la ID de canal **${ID_CANAL_ENVIO}** sea correcta.`)
        .setThumbnail(THUMB);
      return interaction.reply({ embeds: [errorEmbed], flags: 64 });
    }

    await interaction.deferReply({ ephemeral: true });

    // --- Envío del panel de PC ---
    const mensajeId = await enviarPanelPlacas(
      canal,
      PLACAS_PC,
      THUMB,
    );

    // --- Confirmación final ---
    const confirmEmbed = new EmbedBuilder()
      .setColor("#4caf50")
      .setTitle("✅ Mensaje de placas de Protección Civil enviado correctamente.")
      .setDescription(`Mensaje enviado en <#${ID_CANAL_ENVIO}>. Su ID es: \`${mensajeId}\``)
      .setThumbnail(THUMB);

    return interaction.editReply({ embeds: [confirmEmbed] });
  },
};