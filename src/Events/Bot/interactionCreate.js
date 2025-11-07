// interactionCreate.js

export default {
    name: "interactionCreate",
    async execute(interaction, client) {
        
        // --- 1. Manejo de Comandos Slash ---
        if (interaction.isCommand()) {
            const command = client.commands.get(interaction.commandName); 

            if (!command) {
                if (!interaction.replied) {
                   return interaction.reply({ content: "🚫 Este comando no está registrado.", ephemeral: true }).catch(() => {});
                }
                return;
            }

            try {
                // El comando verificar.js maneja su propia respuesta (reply)
                await command.execute(interaction, client);
            } catch (error) {
                console.error(`❌ Error al ejecutar el comando ${interaction.commandName}:`, error);
                
                // Intenta responder o editar si ya se hizo defer
                const content = "⚠️ Ocurrió un error al ejecutar este comando.";
                if (interaction.deferred || interaction.replied) {
                    await interaction.editReply({ content: content, ephemeral: true }).catch(() => {});
                } else {
                    await interaction.reply({ content: content, ephemeral: true }).catch(() => {});
                }
            }
        }

        // --- 2. Manejo de Botones (Verificación) ---
        else if (interaction.isButton()) {
            const buttonHandler = client.buttons.get(interaction.customId); 

            if (!buttonHandler) {
                if (!interaction.replied) {
                    return interaction.reply({ content: "🚫 Error interno: Manejador de botón no encontrado.", ephemeral: true }).catch(() => {});
                }
                return;
            }

            try {
                // APLAZAR RESPUESTA (DEFER REPLY): CRUCIAL
                // Solo ejecuta deferReply si aún no ha sido respondida o diferida.
                if (!interaction.deferred && !interaction.replied) {
                    await interaction.deferReply({ ephemeral: true }); 
                }

                // Ejecutar la lógica del botón (iniciar.js)
                await buttonHandler.execute(interaction, client);

            } catch (error) {
                console.error(`❌ Error al ejecutar el botón ${interaction.customId}:`, error);
                
                // Si hay un error, usar editReply si es posible.
                if (interaction.deferred || interaction.replied) {
                    await interaction.editReply({
                        content: "⚠️ Ocurrió un error inesperado al procesar la verificación.",
                    }).catch(() => {});
                }
            }
        }
    },
};