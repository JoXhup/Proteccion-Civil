# Usa la imagen oficial de Bun
FROM oven/bun:latest

# Crea el directorio de trabajo
WORKDIR /app

# Copia los archivos del proyecto
COPY . .

# Instala las dependencias
RUN bun install

# Expón el puerto (no obligatorio para bots, pero útil)
EXPOSE 3000

# Comando para ejecutar el bot
CMD ["bun", "index.js"]
