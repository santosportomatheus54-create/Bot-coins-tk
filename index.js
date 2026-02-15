const {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");

const fs = require("fs");

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers],
});

const TOKEN = process.env.TOKEN;

// ===== IDS =====
const ROLES = {
  VIP7: "1472452088834424994",
  VIP30: "1472452205972947095",
  MIRA: "1472452374059684016",
  REI: "1472452481845035102",

  BRONZE: "1472458770008244471",
  PRATA: "1472459013366222881",
  GOLD: "1472459115694391306",
};

// ===== DATABASE =====
let db = {};
if (fs.existsSync("db.json")) {
  db = JSON.parse(fs.readFileSync("db.json"));
}

function salvar() {
  fs.writeFileSync("db.json", JSON.stringify(db, null, 2));
}

// ===== CRIAR PERFIL =====
function perfil(id) {
  if (!db[id]) {
    db[id] = {
      coins: 0,
      xp: 0,
      vip: 0,
    };
    salvar();
  }
}

// ===== LIGAS =====
async function atualizarLiga(member, id) {
  const xp = db[id].xp;

  if (xp >= 2000) {
    await member.roles.add(ROLES.GOLD).catch(() => {});
  } else if (xp >= 1000) {
    await member.roles.add(ROLES.PRATA).catch(() => {});
  } else {
    await member.roles.add(ROLES.BRONZE).catch(() => {});
  }
}

// ===== VIP EXPIRA =====
setInterval(async () => {
  for (let id in db) {
    if (db[id].vip && db[id].vip < Date.now()) {
      const guilds = client.guilds.cache;
      guilds.forEach(async (g) => {
        const m = await g.members.fetch(id).catch(() => null);
        if (m) {
          m.roles.remove(ROLES.VIP7).catch(() => {});
          m.roles.remove(ROLES.VIP30).catch(() => {});
        }
      });
      db[id].vip = 0;
    }
  }
  salvar();
}, 60000);

// ===== READY =====
client.on("ready", () => {
  console.log(`Online como ${client.user.tag}`);
});

// ===== SLASH =====
client.on("interactionCreate", async (i) => {
  if (!i.isChatInputCommand()) return;

  if (i.commandName === "painel") {
    const embed = new EmbedBuilder()
      .setColor("Red")
      .setImage("https://cdn.discordapp.com/attachments/1471187076723769355/1472460920507601092/file_00000000488c720ebded7dce0dae06a6.png")
      .setDescription(
        "Agora você ganha 1 moeda por partida!\nUse suas moedas pra comprar itens na loja e subir no ranking 🏆\nOs prêmios ficam no inventário e podem ser resgatados em até 10 dias.\n🎮 Confira suas moedas, ranking e inventário nos botões abaixo!"
      );

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("perfil")
        .setLabel("Perfil")
        .setStyle(ButtonStyle.Success),

      new ButtonBuilder()
        .setCustomId("sorte")
        .setLabel("Sorte")
        .setStyle(ButtonStyle.Danger)
    );

    i.reply({ embeds: [embed], components: [row] });
  }
});

// ===== BOTÕES =====
client.on("interactionCreate", async (i) => {
  if (!i.isButton()) return;

  perfil(i.user.id);

  if (i.customId === "perfil") {
    const p = db[i.user.id];

    const embed = new EmbedBuilder()
      .setColor("Red")
      .setTitle(`Perfil de ${i.user.username}`)
      .setDescription(
        `💰 Coins: ${p.coins}\n📈 XP: ${p.xp}`
      );

    i.reply({ embeds: [embed], ephemeral: true });
  }

  if (i.customId === "sorte") {
    const sorte = Math.random() * 100;
    let resultado;

    if (sorte <= 50) {
      db[i.user.id].xp += 200;
      resultado = "200 XP";
    } else if (sorte <= 80) {
      db[i.user.id].xp += 400;
      resultado = "400 XP";
    } else if (sorte <= 90) {
      db[i.user.id].coins += 100;
      resultado = "100 moedas";
    } else if (sorte <= 93) {
      db[i.user.id].coins += 200;
      resultado = "200 moedas";
    } else {
      db[i.user.id].coins += 20;
      resultado = "20 moedas";
    }

    salvar();

    await atualizarLiga(i.member, i.user.id);

    i.reply({
      content: `🎰 Você ganhou ${resultado}`,
      ephemeral: true,
    });
  }
});

// ===== LOGIN =====
client.login(TOKEN);
