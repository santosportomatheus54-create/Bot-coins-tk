const {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  Events,
  SlashCommandBuilder,
  REST,
  Routes
} = require("discord.js");

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;

// ===== REGISTRAR SLASH =====
const comandos = [
  new SlashCommandBuilder()
    .setName("painelmoeda")
    .setDescription("Abrir painel de moedas")
].map(c => c.toJSON());

const rest = new REST({ version: "10" }).setToken(TOKEN);

(async () => {
  try {
    await rest.put(
      Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
      { body: comandos }
    );
    console.log("✅ Slash carregado");
  } catch (err) {
    console.error(err);
  }
})();

// ===== BOT ONLINE =====
client.once("ready", () => {
  console.log(`🔥 Online: ${client.user.tag}`);
});

// ===== SLASH =====
client.on(Events.InteractionCreate, async interaction => {

  // ===== COMANDO =====
  if (interaction.isChatInputCommand()) {
    if (interaction.commandName === "painelmoeda") {

      await interaction.deferReply({ ephemeral: true });

      const embed = new EmbedBuilder()
        .setTitle("💰 ORG TK")
        .setDescription(
          "Agora você ganha moedas!\n\n🎮 Use os botões abaixo!"
        )
        .setColor("Red");

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("sorte")
          .setLabel("Sortear")
          .setStyle(ButtonStyle.Success),

        new ButtonBuilder()
          .setCustomId("vip7")
          .setLabel("VIP 7D")
          .setStyle(ButtonStyle.Primary),

        new ButtonBuilder()
          .setCustomId("vip30")
          .setLabel("VIP 30D")
          .setStyle(ButtonStyle.Primary)
      );

      await interaction.editReply({
        embeds: [embed],
        components: [row]
      });
    }
  }

  // ===== BOTÕES =====
  if (interaction.isButton()) {
    await interaction.deferReply({ ephemeral: true });

    if (interaction.customId === "sorte") {
      return interaction.editReply("🎁 Você ganhou recompensa!");
    }

    if (interaction.customId === "vip7") {
      return interaction.editReply("👑 VIP 7 dias ativado!");
    }

    if (interaction.customId === "vip30") {
      return interaction.editReply("👑 VIP 30 dias ativado!");
    }

    return interaction.editReply("⚠️ Botão não configurado.");
  }
});

client.login(TOKEN);
