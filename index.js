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
    GatewayIntentBits.GuildMembers, // Requerido para gestionar roles
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates,
  ],
  partials: [
    Partials.User,
    Partials.Message,
    Partials.GuildMember, // Esencial para gestionar miembros/roles
    Partials.ThreadMember,
  ],
});

// Inicialización de colecciones para comandos y componentes
client.commands = new Collection();
client.subCommands = new Collection();
client.buttons = new Collection(); // Colección para botones
client.modals = new Collection();
client.selectMenus = new Collection();

// Importación de manejadores
// He ajustado las rutas para que sean consistentes con el primer ejemplo (ej. './src/Handlers/')
import { LoadEvents } from "./src/Handlers/EventHandler.js";
import { LoadModals } from "./src/Handlers/ModalHandler.js";
import loadMenus from "./src/Handlers/MenuHandler.js";
import { LoadButtons } from "./src/Handlers/ButtonHandler.js"; // Asegúrate de que esta ruta sea correcta

// Función principal asíncrona para cargar y ejecutar
(async () => {
  // 1. Cargar todos los manejadores de componentes interactivos (botones, modales, menús)
  await LoadButtons(client); // Cargar botones
  await LoadModals(client); // Cargar modales
  await loadMenus(client); // Cargar menús

  // 2. Cargar los eventos (incluye el listener 'interactionCreate' que maneja los componentes)
  await LoadEvents(client);

  // Evento 'ready' que se ejecuta una vez que el bot está conectado
  client.once("ready", () => {
    console.log(`✅ Bot prendido como ${client.user.tag}`);
  });

  // 3. Iniciar sesión en Discord
  await client.login(process.env.TOKEN);
})();

// --- Configuración del Servidor Web Express ---
const app = express();

app.get("/", (req, res) => {
  res.send("✅ Bot de Discord activo y funcionando correctamente.");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🌐 Servidor web escuchando en el puerto ${PORT}`));