const {
  Client,
  GatewayIntentBits,
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  REST,
  Routes
} = require("discord.js");
const fs = require("fs");

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

const TOKEN = process.env.TOKEN;

// ===== BANCO =====
function loadDB() {
  return JSON.parse(fs.readFileSync("./database.json"));
}
function saveDB(db) {
  fs.writeFileSync("./database.json", JSON.stringify(db, null, 2));
}

// ===== XP e LIGA =====
function calcularLiga(xp) {
  if (xp >= 5000) return "Diamante";
  if (xp >= 2500) return "Ouro";
  if (xp >= 1000) return "Prata";
  return "Bronze";
}

// ===== COMANDOS SLASH =====
const commands = [
  new SlashCommandBuilder()
    .setName("painelmoeda")
    .setDescription("Painel de moedas e ranking"),
];

client.once("ready", async () => {
  console.log("Bot online");

  const rest = new REST({ version: "10" }).setToken(TOKEN);

  await rest.put(
    Routes.applicationCommands(client.user.id),
    { body: commands }
  );
});

// ===== INTERAÇÕES =====
client.on("interactionCreate", async (interaction) => {

  // ===== SLASH =====
  if (interaction.isChatInputCommand()) {

    if (interaction.commandName === "painelmoeda") {

      const embed = new EmbedBuilder()
        .setColor("Red")
        .setTitle("💰 Sistema de Moedas")
        .setDescription(
`Agora você ganha 1 moeda por partida!
Use suas moedas pra comprar itens na loja e subir no ranking 🏆
Os prêmios ficam no inventário e podem ser resgatados em até 10 dias
🎮 Confira suas moedas, ranking e inventário nos botões abaixo!`
        )
        .setImage("https://i.imgur.com/8Km9tLL.png");

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("perfil")
          .setLabel("Perfil")
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId("loja")
          .setLabel("Loja")
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId("inventario")
          .setLabel("Inventário")
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId("caixa")
          .setLabel("Abrir Caixa")
          .setStyle(ButtonStyle.Danger)
      );

      interaction.reply({ embeds: [embed], components: [row] });
    }
  }

  // ===== BOTÕES =====
  if (interaction.isButton()) {

    const db = loadDB();
    const user = interaction.user.id;

    if (!db[user]) {
      db[user] = {
        coins: 0,
        xp: 0,
        inventario: []
      };
    }

    // ===== PERFIL =====
    if (interaction.customId === "perfil") {

      const liga = calcularLiga(db[user].xp);

      const embed = new EmbedBuilder()
        .setColor("Red")
        .setTitle(`Perfil de ${interaction.user.username}`)
        .addFields(
          { name: "Moedas", value: `${db[user].coins}`, inline: true },
          { name: "XP", value: `${db[user].xp}`, inline: true },
          { name: "Liga", value: liga, inline: true }
        );

      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    // ===== LOJA =====
    if (interaction.customId === "loja") {
      const loja = JSON.parse(fs.readFileSync("./loja.json"));

      let texto = "";
      for (let item in loja) {
        texto += `**${item}** - ${loja[item]} moedas\n`;
      }

      const embed = new EmbedBuilder()
        .setColor("Red")
        .setTitle("🛒 Loja")
        .setDescription(texto);

      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    // ===== INVENTÁRIO =====
    if (interaction.customId === "inventario") {

      const itens = db[user].inventario.length > 0
        ? db[user].inventario.join("\n")
        : "Nenhum item";

      const embed = new EmbedBuilder()
        .setColor("Red")
        .setTitle("🎒 Inventário")
        .setDescription(itens);

      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    // ===== CAIXA =====
    if (interaction.customId === "caixa") {

      const caixas = JSON.parse(fs.readFileSync("./caixas.json"));
      const recompensas = caixas.comum;

      const premio =
        recompensas[Math.floor(Math.random() * recompensas.length)];

      if (premio.tipo === "coins") {
        db[user].coins += premio.valor;
      }

      if (premio.tipo === "xp") {
        db[user].xp += premio.valor;
      }

      saveDB(db);

      const embed = new EmbedBuilder()
        .setColor("Red")
        .setTitle("🎁 Caixa Misteriosa")
        .setDescription(`Você ganhou: ${premio.tipo} ${premio.valor || ""}`);

      return interaction.reply({ embeds: [embed], ephemeral: true });
    }
  }
});

client.login(TOKEN);
