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
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers]
});

const TOKEN = process.env.TOKEN;

// ===== CARGOS =====
const CARGOS = {
  VIP7: "1472452088834424994",
  VIP30: "1472452205972947095",
  REI: "1472452374059684016",
  MIRA: "1472452481845035102"
};

// ===== BANCO =====
function loadDB() {
  return JSON.parse(fs.readFileSync("./database.json"));
}
function saveDB(db) {
  fs.writeFileSync("./database.json", JSON.stringify(db, null, 2));
}

// ===== VIP =====
function adicionarVIP(db, id, dias) {
  const agora = Date.now();
  const tempo = dias * 24 * 60 * 60 * 1000;

  if (!db[id].vip) db[id].vip = [];
  db[id].vip.push({ expira: agora + tempo });
}

// ===== SLASH =====
const commands = [
  new SlashCommandBuilder()
    .setName("painelmoeda")
    .setDescription("Painel de moedas")
];

client.once("ready", async () => {
  console.log("Bot online");

  const rest = new REST({ version: "10" }).setToken(TOKEN);
  await rest.put(
    Routes.applicationCommands(client.user.id),
    { body: commands }
  );

  // ===== VERIFICAR VIP =====
  setInterval(async () => {
    const db = loadDB();

    for (let user in db) {

      if (!db[user].vip) continue;

      const membro = await client.guilds.cache
        .first()
        .members.fetch(user)
        .catch(() => null);

      if (!membro) continue;

      const agora = Date.now();

      db[user].vip = db[user].vip.filter(async (v) => {

        if (agora > v.expira) {

          await membro.roles.remove(CARGOS.VIP7).catch(() => {});
          await membro.roles.remove(CARGOS.VIP30).catch(() => {});

          return false;
        }

        return true;
      });
    }

    saveDB(db);
  }, 60000);
});

// ===== INTERAÇÃO =====
client.on("interactionCreate", async (interaction) => {

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
        );

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId("perfil").setLabel("Perfil").setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId("loja").setLabel("Loja").setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId("inventario").setLabel("Inventário").setStyle(ButtonStyle.Secondary)
      );

      return interaction.reply({ embeds: [embed], components: [row] });
    }
  }

  // ===== BOTÕES =====
  if (interaction.isButton()) {

    const db = loadDB();
    const id = interaction.user.id;

    if (!db[id]) {
      db[id] = { coins: 100, inventario: [] };
    }

    // ===== PERFIL =====
    if (interaction.customId === "perfil") {

      const embed = new EmbedBuilder()
        .setColor("Red")
        .setTitle("Seu Perfil")
        .addFields({ name: "Moedas", value: `${db[id].coins}` });

      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    // ===== LOJA =====
    if (interaction.customId === "loja") {

      const embed = new EmbedBuilder()
        .setColor("Red")
        .setTitle("🛒 Loja");

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId("vip7").setLabel("VIP 7D (10)").setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId("vip30").setLabel("VIP 30D (40)").setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId("rei").setLabel("Rei TK (25)").setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId("mira").setLabel("Mira Abusiva (45)").setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId("caixa").setLabel("Caixa (25)").setStyle(ButtonStyle.Danger)
      );

      return interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
    }

    // ===== FUNÇÃO COMPRA =====
    async function comprar(preco, cargo, nome) {

      if (db[id].coins < preco)
        return interaction.reply({ content: "Sem moedas!", ephemeral: true });

      db[id].coins -= preco;
      db[id].inventario.push(nome);
      saveDB(db);

      if (cargo) {
        const membro = await interaction.guild.members.fetch(id);
        await membro.roles.add(cargo);
      }

      return interaction.reply({ content: `Comprado: ${nome}`, ephemeral: true });
    }

    // ===== VIP =====
    if (interaction.customId === "vip7") {
      adicionarVIP(db, id, 7);
      return comprar(10, CARGOS.VIP7, "VIP 7 dias");
    }

    if (interaction.customId === "vip30") {
      adicionarVIP(db, id, 30);
      return comprar(40, CARGOS.VIP30, "VIP 30 dias");
    }

    if (interaction.customId === "rei")
      return comprar(25, CARGOS.REI, "Rei da TK");

    if (interaction.customId === "mira")
      return comprar(45, CARGOS.MIRA, "Mira Abusiva");

    // ===== CAIXA =====
    if (interaction.customId === "caixa") {

      if (db[id].coins < 25)
        return interaction.reply({ content: "Sem moedas!", ephemeral: true });

      db[id].coins -= 25;

      const premios = [50, 100, 200];
      const ganho = premios[Math.floor(Math.random() * premios.length)];

      db[id].coins += ganho;
      saveDB(db);

      const embed = new EmbedBuilder()
        .setColor("Red")
        .setTitle("🎁 Caixa Misteriosa")
        .setDescription(`Você ganhou ${ganho} moedas!`);

      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    // ===== INVENTÁRIO =====
    if (interaction.customId === "inventario") {

      const itens = db[id].inventario.length > 0
        ? db[id].inventario.join("\n")
        : "Nenhum item";

      const embed = new EmbedBuilder()
        .setColor("Red")
        .setTitle("🎒 Inventário")
        .setDescription(itens);

      return interaction.reply({ embeds: [embed], ephemeral: true });
    }
  }
});

client.login(TOKEN);
