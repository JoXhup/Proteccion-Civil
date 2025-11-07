import {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  BaseInteraction,
} from "discord.js";

export default (client) => {
  client.Pagination = class EmbedPagination {
    constructor(interaction) {
      if (!interaction || !(interaction instanceof BaseInteraction)) {
        throw new Error(
          "Interacción inválida. Asegúrate de pasar una interacción válida de Discord.js.",
        );
      }

      this.interaction = interaction;
      this.pages = [];
      this.pageIndex = 0;
      this.collector = null;
      this.message = null;
      this.options = {
        method: null,
        keepIndex: false,
        buttons: {
          first: {
            label: "≪",
            style: ButtonStyle.Primary,
          },
          previous: {
            label: "⇐",
            style: ButtonStyle.Primary,
          },
          index: {
            disabled: false,
            label: "[ {index} / {max} ]",
            style: ButtonStyle.Secondary,
          },
          next: {
            label: "⇒",
            style: ButtonStyle.Primary,
          },
          last: {
            label: "≫",
            style: ButtonStyle.Primary,
          },
        },
      };
    }

    keepIndexCount(input) {
      if (typeof input !== "boolean") {
        return new Error(
          "Entrada inválida: keepIndex solo acepta valores booleanos.",
        );
      }
      this.options.keepIndex = input;
      return this;
    }

    hideIndexButton(input) {
      if (typeof input !== "boolean") {
        return new Error(
          "Entrada inválida: disableIndexButton solo acepta valores booleanos.",
        );
      }
      this.options.buttons.index.disabled = input;
      return this;
    }

    changeButton(type, { label, style }) {
      const typeRegEx = /\b(first|previous|index|next|last)\b/;
      const styleRegEx = /\b(Success|Danger|Primary|Secondary)\b/;
      if (typeof type !== "string" || !typeRegEx.test(type)) {
        return new Error(
          'Tipo inválido: ¡Debes especificar qué botón cambiar! Opciones disponibles: ["first", "previous", "index", "next", "last"].',
        );
      }
      if (
        (label && typeof label !== "string") ||
        label?.length < 1 ||
        label?.length > 25
      ) {
        return new Error(
          "Etiqueta inválida: ¡La etiqueta debe ser una cadena válida entre 1 y 25 caracteres!",
        );
      }
      if (style && !styleRegEx.test(style)) {
        return new Error(
          "Estilo inválido: ¡El estilo debe ser un 'Style String Type' válido o una instancia directa de ButtonStyle!",
        );
      }

      if (label) this.options.buttons[type].label = label;
      if (style) this.options.buttons[type].style = style;

      return this;
    }

    addPages(embedsArray) {
      if (
        !Array.isArray(embedsArray) ||
        embedsArray.some((embed) => !(embed instanceof EmbedBuilder))
      ) {
        throw new Error(
          "Array de embeds inválido: Proporciona un array que contenga solo instancias de EmbedBuilder.",
        );
      }
      if (this.options.method && this.options.method !== "addEmbeds") {
        throw new Error(
          "Conflicto de métodos: No se puede usar addPages después de createPages.",
        );
      }
      this.options.method = "addEmbeds";
      this.pages.push(...embedsArray);
      return this;
    }

    createPages(content, embedBase, max = 6) {
      if (
        !Array.isArray(content) ||
        content.some((c) => typeof c !== "string")
      ) {
        throw new Error(
          "Formato de contenido inválido: Proporciona un array de strings para la paginación.",
        );
      }
      if (max < 1 || max > 15 || isNaN(max)) {
        throw new Error(
          "Valor máximo inválido: 'max' debe ser un número entre 1 y 15.",
        );
      }
      if (!(embedBase instanceof EmbedBuilder)) {
        throw new Error(
          "Instancia de embed inválida: Proporciona una instancia válida de EmbedBuilder para incrustar el contenido.",
        );
      }
      if (this.options.method && this.options.method !== "createPages") {
        throw new Error(
          "Conflicto de métodos: No se puede usar createPages después de addPages.",
        );
      }

      const maxPage = Math.ceil(content.length / max);

      this.pages = content.reduce((pages, _, i) => {
        if (i % max === 0) {
          const pageContent = [
            embedBase.data.description,
            ...content.slice(i, i + max),
          ]
            .filter(Boolean)
            .join("\n\n");
          const newEmbed = EmbedBuilder.from(embedBase)
            .setDescription(pageContent)
            .setFooter({
              text: `Página ${Math.floor(i / max) + 1} de ${maxPage}`,
            });
          pages.push(newEmbed);
        }
        return pages;
      }, []);

      this.options.method = "createPages";
      return this;
    }

    async display() {
      if (!this.pages.length) {
        throw new Error(
          "Error de visualización: No hay páginas disponibles para mostrar.",
        );
      }

      if (!this.options.keepIndex) {
        this.pageIndex = 0;
      } else {
        this.pageIndex =
          this.pageIndex + 1 > this.pages.length
            ? this.pages.length - 1
            : this.pageIndex;
      }

      if (this.collector) this.collector.stop();

      if (this.options.method === "createPages") {
        this.message = await this.interaction.fetchReply();
      }

      let existingComponents = this.message?.components || [];
      const buttons = this.#createButtons();

      existingComponents =
        this.#filterOutPaginationComponents(existingComponents);
      if (this.pages.length > 1) existingComponents.push(buttons);

      const response = {
        embeds: [this.pages[this.pageIndex]],
        components: existingComponents,
      };

      try {
        this.message = await this.interaction.reply(response);
      } catch (e) {
        this.message = await this.interaction.editReply(response);
      }

      this.#updateHandling();
      return this;
    }

    #updateHandling() {
      this.collector = this.message.createMessageComponentCollector({
        idle: 60000,
      });

      this.collector.on("collect", async (i) => {
        if (!i.isButton() || !i.customId.startsWith("@page")) return;
        if (i.user.id !== this.interaction.user.id) {
          return i.reply({
            content: "No tienes permiso para usar este botón.",
            ephemeral: true,
          });
        }

        switch (i.customId) {
          case "@pageFirst":
            this.pageIndex = 0;
            break;
          case "@pagePrev":
            this.pageIndex = Math.max(this.pageIndex - 1, 0);
            break;
          case "@pageNext":
            this.pageIndex = Math.min(
              this.pageIndex + 1,
              this.pages.length - 1,
            );
            break;
          case "@pageLast":
            this.pageIndex = this.pages.length - 1;
            break;
        }

        await this.#updatePagination(i);
      });

      this.collector.on("end", () => {
        this.interaction.editReply({
          components: [],
        });
      });
    }

    #createButtons(disabled = false) {
      const { first, previous, index, next, last } = this.options.buttons;
      const formattedLabel = index.label.replace(/{index}|{max}/g, (match) => {
        switch (match) {
          case "{index}":
            return `${this.pageIndex + 1}`;
          case "{max}":
            return `${this.pages.length}`;
          default:
            return match;
        }
      });

      const row = new ActionRowBuilder().setComponents(
        new ButtonBuilder()
          .setCustomId("@pageFirst")
          .setLabel(first.label)
          .setStyle(first.style)
          .setDisabled(disabled || this.pageIndex === 0),
        new ButtonBuilder()
          .setCustomId("@pagePrev")
          .setLabel(previous.label)
          .setStyle(previous.style)
          .setDisabled(disabled || this.pageIndex === 0),
      );

      if (!index.disabled)
        row.addComponents(
          new ButtonBuilder()
            .setCustomId("@pageIndex")
            .setLabel(formattedLabel)
            .setStyle(index.style)
            .setDisabled(true),
        );

      row.addComponents(
        new ButtonBuilder()
          .setCustomId("@pageNext")
          .setLabel(next.label)
          .setStyle(next.style)
          .setDisabled(disabled || this.pageIndex === this.pages.length - 1),
        new ButtonBuilder()
          .setCustomId("@pageLast")
          .setLabel(last.label)
          .setStyle(last.style)
          .setDisabled(disabled || this.pageIndex === this.pages.length - 1),
      );

      return row;
    }

    #updatePagination(interaction) {
      const buttons = this.#createButtons();
      let existingComponents = this.message.components || [];

      existingComponents =
        this.#filterOutPaginationComponents(existingComponents);
      existingComponents.push(buttons);

      interaction.update({
        embeds: [this.pages[this.pageIndex]],
        components: existingComponents,
      });
    }

    #filterOutPaginationComponents(components) {
      return components.filter((row) =>
        row.components.some(
          (component) =>
            component.customId && !component.customId.startsWith("@page"),
        ),
      );
    }
  };
};
