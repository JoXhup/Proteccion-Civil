import {
  ChatInputCommandInteraction,
  EmbedBuilder,
  SlashCommandBuilder,
} from "discord.js";

export default {
  data: new SlashCommandBuilder()
    .setName("ping")
    .setDescription("🛠️ Revisa el estado del bot"),

  /**
   *
   * @param {ChatInputCommandInteraction} interaction
   * @param {Client} client
   */
  async execute(interaction, client) {
    const ping = interaction.client.ws.ping;

    const pingEmoji =
      ping <= 180
        ? "<:Up:1435087035391283261>"
        : "<:Low:1435087122221760662>";

    const totalUsers = client.users.cache.size;

    const botPing = Math.abs(Date.now() - interaction.createdTimestamp);

    const botPingEmoji =
      botPing <= 180
        ? "<:Up:1435087035391283261>"
        : "<:Low:1435087122221760662>";

    const embed = new EmbedBuilder()
      .setColor("Random")
      .setThumbnail(client.user.displayAvatarURL())
      .setTitle("📶 Estado del Bot")
      .setFields(
        { name: "Latencia de Discord", value: `${ping}ms ${pingEmoji}` },
        { name: "Usuarios Totales", value: `${totalUsers}` },
        {
          name: "Ping del Bot",
          value: `${botPing}ms ${botPingEmoji}`,
        },
      )
      .setFooter({ text: `Solicitado por ${interaction.user.tag}` })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};