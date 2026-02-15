const {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  Events
} = require("discord.js");

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

// 🔑 TOKEN
const TOKEN = process.env.TOKEN;

// ===== IDS DOS CARGOS =====
const CARGOS = {
  vip7: "1472452088834424994",
  vip30: "1472452205972947095",
  mira: "1472452374059684016",
  rei: "1472452481845035102",

  bronze: "1472458770008244471",
  prata: "1472459013366222881",
  gold: "1472459115694391306"
};

// ===== BANCO =====
let jogadores = {};
let vips = {};

// ===== PERFIL =====
function criarPerfil(id) {
  if (!jogadores[id]) {
    jogadores[id] = {
      xp: 0,
      moedas: 0
    };
  }
}

// ===== VIP EXPIRAÇÃO =====
setInterval(async () => {
  const agora = Date.now();
  const guild = client.guilds.cache.first();

  for (let id in vips) {
    if (vips[id].expira <= agora) {
      const membro = await guild.members.fetch(id).catch(() => null);
      if (membro) {
        membro.roles.remove(vips[id].cargo).catch(() => {});
      }
      delete vips[id];
    }
  }
}, 60000);

// ===== BOT ON =====
client.once("ready", () => {
  console.log(`🔥 Bot online: ${client.user.tag}`);
});

// ===== INTERAÇÕES =====
client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isButton() && !interaction.isChatInputCommand()) return;

  try {
    // ⚡ resposta rápida
    await interaction.deferReply({ ephemeral: true });

    // ⏳ delay 2s
    await new Promise(r => setTimeout(r, 2000));

    criarPerfil(interaction.user.id);

    // ===== BOTÃO SORTE =====
    if (interaction.customId === "sorte") {
      let r = Math.random() * 100;
      let premio;

      if (r <= 50) {
        jogadores[interaction.user.id].xp += 200;
        premio = "200 XP";
      } else if (r <= 80) {
        jogadores[interaction.user.id].xp += 400;
        premio = "400 XP";
      } else if (r <= 90) {
        jogadores[interaction.user.id].moedas += 100;
        premio = "100 moedas";
      } else {
        jogadores[interaction.user.id].moedas += 200;
        premio = "200 moedas";
      }

      await interaction.editReply(`🎁 Você ganhou **${premio}**!`);
      atualizarCargos(interaction.member);
    }

    // ===== VIP 7D =====
    if (interaction.customId === "vip7") {
      const tempo = 7 * 24 * 60 * 60 * 1000;

      await interaction.member.roles.add(CARGOS.vip7);

      vips[interaction.user.id] = {
        cargo: CARGOS.vip7,
        expira: Date.now() + tempo
      };

      await interaction.editReply("👑 VIP 7 dias ativado!");
    }

    // ===== VIP 30D =====
    if (interaction.customId === "vip30") {
      const tempo = 30 * 24 * 60 * 60 * 1000;

      await interaction.member.roles.add(CARGOS.vip30);

      vips[interaction.user.id] = {
        cargo: CARGOS.vip30,
        expira: Date.now() + tempo
      };

      await interaction.editReply("👑 VIP 30 dias ativado!");
    }

  } catch (err) {
    console.error(err);
    if (interaction.deferred) {
      await interaction.editReply("❌ Erro no comando.");
    }
  }
});

// ===== CARGOS AUTOMÁTICOS =====
async function atualizarCargos(member) {
  const xp = jogadores[member.id].xp;

  if (xp >= 5000) await member.roles.add(CARGOS.gold).catch(() => {});
  else if (xp >= 2000) await member.roles.add(CARGOS.prata).catch(() => {});
  else if (xp >= 500) await member.roles.add(CARGOS.bronze).catch(() => {});
}

// ===== PAINEL =====
client.on("messageCreate", async msg => {
  if (msg.content === "!painel") {
    const embed = new EmbedBuilder()
      .setTitle("ORG TK 💸")
      .setDescription(
        "Agora você ganha 1 moeda por partida!\nUse suas moedas pra comprar itens na loja e subir no ranking 🏆"
      )
      .setImage("https://cdn.discordapp.com/attachments/1471187076723769355/1472460920507601092/file_00000000488c720ebded7dce0dae06a6.png")
      .setColor("Red");

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("sorte")
        .setLabel("Sortear 💸")
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

    msg.channel.send({ embeds: [embed], components: [row] });
  }
});

client.login(TOKEN);
