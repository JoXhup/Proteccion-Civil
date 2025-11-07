import { Events, EmbedBuilder, AttachmentBuilder } from "discord.js";
import { fileURLToPath } from "url";
import path from "path";
import canvafy from "bun-canvafy";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const paths = {
    Bienvenida: path.resolve(__dirname, "../../Utils/Assets/Banner.png"),
};

export default {
    name: Events.GuildMemberAdd,
    /**
     * @param {import("discord.js").GuildMember} member
     * @param {import("discord.js").Client} client
     */
    async execute(member, client) {
        const { guild } = member;
        if (member.user.bot) return;

        // ** BLOQUE DE CÓDIGO PROBLEMÁTICO ELIMINADO **
        // Se quitó la referencia a 'rolesToAdd' no definida.

        const Img = await new canvafy.WelcomeLeave()
            .setBackground("image", paths.Bienvenida)
            .setTitle(member.user.username)
            .setDescription("¡Bienvenid@ Protección Civil!")
            .setBorder("#630000")
            .setAvatarBorder("#084eff")
            .setAvatar(member.user.displayAvatarURL({ extension: "png", size: 256 }))
            .setOverlayOpacity(0.3)
            .build();

        const Attachment = new AttachmentBuilder(Img, {
            name: "welcome.png",
        });

        const Bienvenida = new EmbedBuilder()
            .setAuthor({
                name: client.user.username,
                iconURL: client.user.displayAvatarURL(),
            })
            .setThumbnail(client.user.displayAvatarURL())
            .setImage("attachment://welcome.png")
            .setColor("#b40732")
            .setDescription(
                `👋 ¡Una cálida bienvenida a **<@${member.id}>**! Eres el miembro **#${guild.memberCount}**.\n\n` +
                `Bienvenido a **Protección Civil de MXRP**. llegaste a una institucion que busca la protección y seguridad de sus ciudadanos.\n\n` +
                `**Pasos Importantes para Empezar:**\n` +
                `* **Revisa nuestros avisos:** Mantente al día con las novedades y cambios críticos.\n` +
                `    [** Canal de Postulacion **](https://discord.com/channels/1435010305536299040/1435027982682165289)\n\n` +
                `* **Consulta dudas & apoyo general:** Busca soluciones rápidas o pide ayuda a la comunidad.\n` +
                `    [** Soporte **](https://discord.com/channels/1435010305536299040/1435033685882703914)\n\n` +
                `¡Gracias por ser uno mas de esta familia!`
            )
            .setFooter({ text: "MXRP© P.C System" })
            .setTimestamp();

        const Channel = "1435026340913877124";

        try {
            await guild.channels.cache.get(Channel)?.send({
                embeds: [Bienvenida],
                files: [Attachment],
            });
        } catch (error) {
            console.error(`[❌ Error al enviar mensaje en el canal ${Channel}]`, error);
        }
    },
};