import { SlashCommandBuilder, PermissionFlagsBits } from "discord.js";
import { POINTS, DA_LOG_CHANNEL_ID, BAN_THRESHOLD } from "../config.js";
import { setPoints } from "../utils/pointsStore.js";
import { buildDALogEmbed, buildDMDaEmbed } from "../utils/embeds.js";
import { ensureStaffOrAdmin } from "../utils/permissions.js";

export default {
  data: new SlashCommandBuilder()
    .setName("ban")
    .setDescription("Ban a user (sets points to threshold)")
    .addUserOption(o => o.setName("user").setDescription("User to ban").setRequired(true))
    .addStringOption(o => o.setName("reason").setDescription("Reason for ban").setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

  async execute(interaction) {
    try {
      ensureStaffOrAdmin(interaction);
    } catch (e) {
      return interaction.reply({ content: e.message, ephemeral: true });
    }
    const target = interaction.options.getUser("user", true);
    const reason = interaction.options.getString("reason") || "No reason provided";

    const member = await interaction.guild.members.fetch(target.id).catch(() => null);

    // DM first
    try {
      await target.send({ embeds: [buildDMDaEmbed({ action: "Ban", reason, pointsAfter: BAN_THRESHOLD })] });
    } catch {}

    if (member) {
      if (!member.bannable) return interaction.reply({ content: "I cannot ban this member.", ephemeral: true });
      await member.ban({ reason }).catch(() => null);
    } else {
      await interaction.guild.bans.create(target.id, { reason }).catch(() => null);
    }

    const pointsAfter = setPoints(target.id, BAN_THRESHOLD);

    // Log in channel
    const logChannel = await interaction.guild.channels.fetch(DA_LOG_CHANNEL_ID).catch(() => null);
    if (logChannel && logChannel.isTextBased()) {
      await logChannel.send({ embeds: [buildDALogEmbed({
        action: "Ban",
        target,
        reason,
        moderatorTag: interaction.user.tag,
        pointsAfter,
        pointsDelta: 0
      })] });
    }

    await interaction.reply({ content: `Banned ${target.tag}. Points set to ${pointsAfter}.`, ephemeral: true });

    interaction.client.emit("pointsUpdated", { guild: interaction.guild, targetUser: target, moderatorTag: interaction.user.tag, reason, pointsAfter });
  }
};
