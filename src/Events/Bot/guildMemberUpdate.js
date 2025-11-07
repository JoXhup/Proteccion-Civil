// C:\Users\Joshu\OneDrive\Desktop\Protección Civil\src\Events\Bot\guildMemberUpdate.js

const { Events } = require('discord.js');

// Exportamos un objeto con el nombre del evento y la función a ejecutar
module.exports = {
    name: Events.GuildMemberUpdate, // Esto resuelve el error "[Error] ... no tiene nombre."
    
    // La función 'execute' recibirá el 'client' si lo pasas desde tu main loader, 
    // pero para los eventos de miembros, solo necesitas (oldMember, newMember)
    // El 'client' es accesible a través de newMember.client si es necesario.
    
    async execute(oldMember, newMember) {
        
        // 1. Define los IDs de los roles
        const ROL_ESCUCHADO_ID = '1435018200097095791'; 
        
        // CORRECCIÓN CLAVE: Obtén el ID del bot desde newMember.client
        // O simplemente usa el ID estático si sabes cuál es el bot específico a ignorar:
        // const ROL_BOT_A_IGNORAR = '1435018200097095791'; 
        
        // Si quieres obtener el ID del bot que está ejecutando este código:
        const CLIENT_BOT_ID = newMember.client.user.id; 

        // Definición de Roles (continúa con tus listas)
        const ROLES_A_DAR = [
            '1435018312504447091',
            '1435018722543931404',
            '1435019080318062692',
            '1435018362898878665',
            '1435018414287753236'
        ];

        const ROLES_A_QUITAR = [
            '1435018568394739782',
            '1435018581120389131',
            '1435018710434713691',
            '1435060665541984358',
            '1435060713310912603'
        ];
        
        // 2. VERIFICACIÓN DEL BOT
        // Tu solicitud original era ignorar a CUALQUIERA que fuera un bot, 
        // EXCEPTO un bot con ID '1435018200097095791' 
        // (Aunque este ID parece ser el rol que estás monitoreando)

        // **Ajuste la lógica de bot:**
        
        // Opción A: Ignorar a *todos* los bots. (Lo más común)
        if (newMember.user.bot) return;
        
        // Opción B: Ignorar un bot específico (1435018200097095791) si es un bot.
        // if (newMember.user.bot && newMember.user.id === '1435018200097095791') return;
        
        // Opción C (Basada en tu solicitud original: al dar este rol a cualquiera que **no sea** un bot 1435018200097095791)
        // Ya que el ID que diste es el ROL a escuchar y no un ID de Bot, usaré la Opción A: ignorar a todos los miembros que sean bots.
        if (newMember.user.bot) return;


        const tieneRolAnteriormente = oldMember.roles.cache.has(ROL_ESCUCHADO_ID);
        const tieneRolAhora = newMember.roles.cache.has(ROL_ESCUCHADO_ID);

        // 3. Comprueba si el rol fue *añadido*
        if (!tieneRolAnteriormente && tieneRolAhora) {
            
            console.log(`El rol ${ROL_ESCUCHADO_ID} fue dado a ${newMember.user.tag}. Aplicando acciones.`);

            // --- 4. Dar Roles ---
            // Usamos await porque estamos en una función async
            try {
                await newMember.roles.add(ROLES_A_DAR);
                console.log(`Roles dados a ${newMember.user.tag}: ${ROLES_A_DAR.join(', ')}`);
            } catch (error) {
                console.error(`Error al dar roles a ${newMember.user.tag}:`, error);
            }

            // --- 5. Quitar Roles (solo si los tiene) ---
            const rolesAQuitarExistentes = ROLES_A_QUITAR.filter(roleId => newMember.roles.cache.has(roleId));

            if (rolesAQuitarExistentes.length > 0) {
                try {
                    await newMember.roles.remove(rolesAQuitarExistentes);
                    console.log(`Roles quitados a ${newMember.user.tag}: ${rolesAQuitarExistentes.join(', ')}`);
                } catch (error) {
                    console.error(`Error al quitar roles a ${newMember.user.tag}:`, error);
                }
            } else {
                console.log(`El miembro ${newMember.user.tag} no tenía ninguno de los roles a quitar.`);
            }
        }
    },
};