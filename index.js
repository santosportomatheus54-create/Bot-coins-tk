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

const TOKEN = process.env.TOKEN;

// ===== IDS =====
const CARGOS = {
  vip7: "1472452088834424994",
  vip30: "1472452205972947095",

  bronze: "1472458770008244471",
  prata: "1472459013366222881",
  gold: "1472459115694391306"
};

// ===== BANCO =====
let jogadores = {};
let vips = {};

function criarPerfil(id) {
  if (!jogadores[id]) {
    jogadores[id] = { xp: 0, moedas: 0 };
  }
}

// ===== EXPIRA VIP =====
setInterval(async () => {
  const guild = client.guilds.cache.first();
  const agora = Date.now();

  for (let id in vips) {
    if (vips[id].expira <= agora) {
      const membro = await guild.members.fetch(id).catch(() => null);
      if (membro) membro.roles.remove(vips[id].cargo).catch(() => {});
      delete vips[id];
    }
  }
}, 60000);

// ===== BOT ONLINE =====
client.once("ready", () => {
  console.log(`🔥 Online: ${client.user.tag}`);
});

// ===== INTERAÇÕES =====
client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isButton()) return;

  try {
    await interaction.deferReply({ ephemeral: true });
    await new Promise(r => setTimeout(r, 2000));

    criarPerfil(interaction.user.id);

    let respondeu = false;

    // ===== SORTE =====
    if (interaction.customId === "sorte") {
      respondeu = true;

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
    }

    // ===== VIP 7 =====
    if (interaction.customId === "vip7") {
      respondeu = true;

      const tempo = 7 * 24 * 60 * 60 * 1000;
      await interaction.member.roles.add(CARGOS.vip7);

      vips[interaction.user.id] = {
        cargo: CARGOS.vip7,
        expira: Date.now() + tempo
      };

      await interaction.editReply("👑 VIP 7 dias ativado!");
    }

    // ===== VIP 30 =====
    if (interaction.customId === "vip30") {
      respondeu = true;

      const tempo = 30 * 24 * 60 * 60 * 1000;
      await interaction.member.roles.add(CARGOS.vip30);

      vips[interaction.user.id] = {
        cargo: CARGOS.vip30,
        expira: Date.now() + tempo
      };

      await interaction.editReply("👑 VIP 30 dias ativado!");
    }

    // 🔥 Fallback (IMPOSSÍVEL travar)
    if (!respondeu) {
      await interaction.editReply("⚠️ Botão ainda não configurado.");
    }

  } catch (err) {
    console.error(err);
    if (interaction.deferred) {
      await interaction.editReply("❌ Erro inesperado.");
    }
  }
});

// ===== PAINEL =====
client.on("messageCreate", async msg => {
  if (msg.content === "!painel") {
    const embed = new EmbedBuilder()
      .setTitle("ORG TK 💸")
      .setDescription("Use os botões abaixo para ganhar recompensas!")
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
