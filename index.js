import { Client, Partials, GatewayIntentBits, Collection } from "discord.js";
import dotenv from "dotenv";
import express from "express";
dotenv.config();

// Inicialización del cliente de Discord
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

// Inicialización de colecciones
client.commands = new Collection();
client.subCommands = new Collection();
client.buttons = new Collection();
client.modals = new Collection();
client.selectMenus = new Collection();

// Importación de manejadores
import { LoadEvents } from "./src/Handlers/EventHandler.js";
import { LoadModals } from "./src/Handlers/ModalHandler.js";
import loadMenus from "./src/Handlers/MenuHandler.js";
import { LoadButtons } from "./src/Handlers/ButtonHandler.js";

(async () => {
  await LoadButtons(client);
  await LoadModals(client);
  await loadMenus(client);
  await LoadEvents(client);

  client.once("ready", () => {
    console.log(`✅ Bot prendido como ${client.user.tag}`);
  });

  await client.login(process.env.TOKEN);
})();

// --- Servidor Express ---
const app = express();

app.get("/", (req, res) => {
  res.send("✅ Bot de Discord activo y funcionando correctamente.");
});

const PORT = process.env.PORT || 8000; // 👈 Koyeb usa el 8000
app.listen(PORT, () =>
  console.log(`🌐 Servidor web escuchando en el puerto ${PORT}`)
);
