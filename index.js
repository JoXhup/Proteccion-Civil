import { Client, Partials, GatewayIntentBits, Collection } from "discord.js";
import dotenv from "dotenv";
import express from "express";
dotenv.config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildPresences,
    GatewayIntentBits.GuildModeration,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates,
  ],
  partials: [
    Partials.User,
    Partials.Message,
    Partials.GuildMember,
    Partials.ThreadMember,
  ],
});

client.commands = new Collection();
client.subCommands = new Collection();
client.buttons = new Collection();
client.modals = new Collection();
client.selectMenus = new Collection();

import { LoadEvents } from "./src/Handlers/EventHandler.js";
import { LoadModals } from "./src/Handlers/ModalHandler.js";
import loadMenus from "./src/Handlers/MenuHandler.js";

(async () => {
  await LoadEvents(client);
  await LoadModals(client);
  await loadMenus(client);

  client.once("ready", () => {
    console.log(`✅ Bot prendido como ${client.user.tag}`);
  });

  await client.login(process.env.TOKEN);
})();

const app = express();

app.get("/", (req, res) => {
  res.send(":white_check_mark: Bot de Discord activo y funcionando correctamente.");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🌐 Servidor web escuchando en el puerto ${PORT}`));