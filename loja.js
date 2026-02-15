const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const db = require("./database");

const LOJA = {
  vip7: { nome: "VIP 7 Dias", preco: 10, cargo: "1472452088834424994", dias: 7 },
  vip30: { nome: "VIP 30 Dias", preco: 40, cargo: "1472452205972947095", dias: 30 },
  mira: { nome: "Mira Abusiva", preco: 45, cargo: "1472452374059684016" },
  rei: { nome: "Rei da TK", preco: 25, cargo: "1472452481845035102" }
};

async function abrirLoja(interaction) {
  const embed = new EmbedBuilder()
    .setTitle("🛒 LOJA ORG TK")
    .setDescription("Compre cargos exclusivos!\n\nEscolha abaixo:")
    .setColor("Gold");

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId("vip7").setLabel("VIP 7D - 10 moedas").setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId("vip30").setLabel("VIP 30D - 40 moedas").setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId("mira").setLabel("Mira - 45 moedas").setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId("rei").setLabel("Rei - 25 moedas").setStyle(ButtonStyle.Success)
  );

  await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
}

async function comprar(interaction) {
  const item = LOJA[interaction.customId];
  if (!item) return;

  const user = interaction.user.id;
  let perfil = await db.get(user);

  if (!perfil || perfil.moedas < item.preco) {
    return interaction.reply({ content: "❌ Você não tem moedas!", ephemeral: true });
  }

  perfil.moedas -= item.preco;
  await db.set(user, perfil);

  const membro = await interaction.guild.members.fetch(user);
  const cargo = interaction.guild.roles.cache.get(item.cargo);

  if (cargo) await membro.roles.add(cargo);

  // VIP com expiração
  if (item.dias) {
    perfil.vip = {
      cargo: item.cargo,
      expira: Date.now() + item.dias * 86400000
    };
    await db.set(user, perfil);
  }

  interaction.reply({
    content: `✅ Você comprou ${item.nome}!`,
    ephemeral: true
  });
}

module.exports = { abrirLoja, comprar };
