// BOT ECONOMIA + PERFIL + SORTE + LIGAS + VIP AUTOMÁTICO // Discord.js v14

const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionsBitField } = require("discord.js");

const TOKEN = process.env.TOKEN;

// ====== IDS ====== const ROLES = { VIP7: "1472452088834424994", VIP30: "1472452205972947095", MIRA: "1472452374059684016", REI: "1472452481845035102",

BRONZE: "1472458770008244471", PRATA: "1472459013366222881", GOLD: "1472459115694391306", };

// ===== DATABASE ===== const fs = require("fs"); let db = {};

if (fs.existsSync("db.json")) { db = JSON.parse(fs.readFileSync("db.json")); }

function save() { fs.writeFileSync("db.json", JSON.stringify(db, null, 2)); }

function getUser(id) { if (!db[id]) { db[id] = { xp: 0, wins: 0, loses: 0, streak: 0, vip: null, vipExpire: null, }; } return db[id]; }

// ===== CLIENT ===== const client = new Client({ intents: [ GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent, ], });

client.once("ready", () => { console.log("Bot online");

// ===== LOOP VIP ===== setInterval(checkVIP, 60000); });

// ===== PAINEL ===== client.on("interactionCreate", async (interaction) => { if (!interaction.isChatInputCommand()) return;

if (interaction.commandName === "painel") { const embed = new EmbedBuilder() .setColor("Red") .setTitle("🎮 Sistema de Coins") .setImage("https://cdn.discordapp.com/attachments/1471187076723769355/1472460920507601092/file_00000000488c720ebded7dce0dae06a6.png") .setDescription( "Agora você ganha 1 moeda por partida!\n\nUse suas moedas pra comprar itens na loja e subir no ranking 🏆\nOs prêmios ficam no inventário e podem ser resgatados em até 10 dias\n🎮 Confira suas moedas, ranking e inventário nos botões abaixo!" );

const row = new ActionRowBuilder().addComponents(
  new ButtonBuilder()
    .setCustomId("perfil")
    .setLabel("Perfil")
    .setStyle(ButtonStyle.Primary),

  new ButtonBuilder()
    .setCustomId("sorte")
    .setLabel("Sorte")
    .setStyle(ButtonStyle.Success)
);

interaction.reply({ embeds: [embed], components: [row] });

} });

// ===== BOTÕES ===== client.on("interactionCreate", async (interaction) => { if (!interaction.isButton()) return;

const user = getUser(interaction.user.id);

// PERFIL if (interaction.customId === "perfil") { const embed = new EmbedBuilder() .setColor("Red") .setTitle(Perfil de ${interaction.user.username}) .setDescription( XP: ${user.xp}\nVitórias: ${user.wins}\nDerrotas: ${user.loses}\nStreak: ${user.streak} );

interaction.reply({ embeds: [embed], ephemeral: true });

}

// ===== SISTEMA DE SORTE ===== if (interaction.customId === "sorte") { const rand = Math.random() * 100;

let reward = "";

if (rand <= 50) {
  user.xp += 200;
  reward = "Você ganhou 200 XP";
} else if (rand <= 80) {
  user.xp += 400;
  reward = "Você ganhou 400 XP";
} else if (rand <= 90) {
  reward = "Você ganhou 100 moedas";
} else if (rand <= 93) {
  reward = "Você ganhou 200 moedas";
} else {
  reward = "Nada dessa vez 😢";
}

save();

await updateLeague(interaction.member, user);

interaction.reply({ content: reward, ephemeral: true });

} });

// ===== LIGAS ===== async function updateLeague(member, user) { try { const guild = member.guild;

const roles = guild.roles.cache;

const bronze = roles.get(ROLES.BRONZE);
const prata = roles.get(ROLES.PRATA);
const gold = roles.get(ROLES.GOLD);

if (!bronze || !prata || !gold) return;

if (user.xp >= 2000) {
  await member.roles.add(gold);
  await member.roles.remove(bronze);
  await member.roles.remove(prata);
} else if (user.xp >= 1000) {
  await member.roles.add(prata);
  await member.roles.remove(bronze);
  await member.roles.remove(gold);
} else {
  await member.roles.add(bronze);
  await member.roles.remove(prata);
  await member.roles.remove(gold);
}

} catch (e) { console.log("Erro ligas", e); } }

// ===== VIP AUTOMÁTICO ===== async function checkVIP() { const now = Date.now();

for (let id in db) { const user = db[id];

if (user.vip && user.vipExpire && now >= user.vipExpire) {
  try {
    const guilds = client.guilds.cache;

    guilds.forEach(async (guild) => {
      const member = await guild.members.fetch(id).catch(() => null);
      if (!member) return;

      if (user.vip === "VIP7") {
        await member.roles.remove(ROLES.VIP7).catch(() => {});
      }

      if (user.vip === "VIP30") {
        await member.roles.remove(ROLES.VIP30).catch(() => {});
      }
    });

    user.vip = null;
    user.vipExpire = null;
    save();
  } catch (e) {
    console.log("Erro VIP", e);
  }
}

} }

// ===== ADM ===== client.on("messageCreate", async (msg) => { if (!msg.member.permissions.has(PermissionsBitField.Flags.Administrator)) return;

const args = msg.content.split(" ");

if (args[0] === "!win") { const u = msg.mentions.users.first(); if (!u) return;

const user = getUser(u.id);

user.wins++;
user.streak++;
user.xp += 100;

save();

}

if (args[0] === "!lose") { const u = msg.mentions.users.first(); if (!u) return;

const user = getUser(u.id);

user.loses++;
user.streak = 0;

save();

}

// ===== DAR VIP ===== if (args[0] === "!vip7") { const u = msg.mentions.users.first(); if (!u) return;

const member = await msg.guild.members.fetch(u.id);
const user = getUser(u.id);

user.vip = "VIP7";
user.vipExpire = Date.now() + 7 * 24 * 60 * 60 * 1000;

await member.roles.add(ROLES.VIP7);
save();

}

if (args[0] === "!vip30") { const u = msg.mentions.users.first(); if (!u) return;

const member = await msg.guild.members.fetch(u.id);
const user = getUser(u.id);

user.vip = "VIP30";
user.vipExpire = Date.now() + 30 * 24 * 60 * 60 * 1000;

await member.roles.add(ROLES.VIP30);
save();

} });

client.login(TOKEN);
