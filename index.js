import { Client, Partials, GatewayIntentBits } from "discord.js";
// Importar la función para cargar botones
import { LoadButtons } from "@Handlers/ButtonHandler"; // Asegúrate de que esta ruta sea correcta

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

import { LoadEvents } from "@Handlers/EventHandler";

// 1. Cargar los botones ANTES de cargar los eventos/iniciar sesión
LoadButtons(client); 

// 2. Cargar los eventos (donde se gestiona interactionCreate)
LoadEvents(client); 

client.login(process.env.Token);