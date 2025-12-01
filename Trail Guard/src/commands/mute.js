import { SlashCommandBuilder, PermissionFlagsBits } from "discord.js";
import { POINTS, DA_LOG_CHANNEL_ID } from "../config.js";
import { addPoints } from "../utils/pointsStore.js";
import { buildDALogEmbed, buildDMDaEmbed } from "../utils/embeds.js";
import { ensureStaffOrAdmin } from "../utils/permissions.js";

export default {
  data: new SlashCommandBuilder()
    .setName("mute")
    .setDescription("Timeout a user for a specified number of minutes (adds points)")
    .addUserOption(o => o.setName("user").setDescription("User to mute").setRequired(true))
    .addIntegerOption(o => o.setName("minutes").setDescription("Duration in minutes").setRequired(true).setMinValue(1).setMaxValue(10080))
    .addStringOption(o => o.setName("reason").setDescription("Reason for mute").setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  async execute(interaction) {
    try {
      ensureStaffOrAdmin(interaction);
    } catch (e) {
      return interaction.reply({ content: e.message, ephemeral: true });
    }
    const target = interaction.options.getUser("user", true);
    const minutes = interaction.options.getInteger("minutes", true);
    const reason = interaction.options.getString("reason") || `Muted for ${minutes} minutes`;

    const member = await interaction.guild.members.fetch(target.id).catch(() => null);
    if (!member) return interaction.reply({ content: "User not found in this guild.", ephemeral: true });
    if (!member.moderatable) return interaction.reply({ content: "I cannot mute this member.", ephemeral: true });

    const ms = minutes * 60 * 1000;
    await member.timeout(ms, reason).catch(() => null);

    const pointsAfter = addPoints(target.id, POINTS.mute);

    // DM target
    try {
      await target.send({ embeds: [buildDMDaEmbed({ action: "Mute", reason, pointsAfter })] });
    } catch {}

    // Log in channel
    const logChannel = await interaction.guild.channels.fetch(DA_LOG_CHANNEL_ID).catch(() => null);
    if (logChannel && logChannel.isTextBased()) {
      await logChannel.send({ embeds: [buildDALogEmbed({
        action: "Mute",
        target,
        reason,
        moderatorTag: interaction.user.tag,
        pointsAfter,
        pointsDelta: POINTS.mute
      })] });
    }

    await interaction.reply({ content: `Muted ${target.tag} for ${minutes} minutes. Total points: ${pointsAfter}.`, ephemeral: true });

    interaction.client.emit("pointsUpdated", { guild: interaction.guild, targetUser: target, moderatorTag: interaction.user.tag, reason, pointsAfter });
  }
};
