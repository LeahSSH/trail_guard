import { SlashCommandBuilder, PermissionFlagsBits } from "discord.js";
import { POINTS, DA_LOG_CHANNEL_ID } from "../config.js";
import { addPoints, getPoints } from "../utils/pointsStore.js";
import { buildDALogEmbed, buildDMDaEmbed } from "../utils/embeds.js";
import { ensureStaffOrAdmin } from "../utils/permissions.js";

export default {
  data: new SlashCommandBuilder()
    .setName("warn")
    .setDescription("Issue a warning to a user (adds points)")
    .addUserOption(o => o.setName("user").setDescription("User to warn").setRequired(true))
    .addStringOption(o => o.setName("reason").setDescription("Reason for the warning").setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),

  async execute(interaction) {
    try {
      ensureStaffOrAdmin(interaction);
    } catch (e) {
      return interaction.reply({ content: e.message, ephemeral: true });
    }
    const target = interaction.options.getUser("user", true);
    const reason = interaction.options.getString("reason") || "No reason provided";

    const pointsAfter = addPoints(target.id, POINTS.warn);

    // DM target
    try {
      await target.send({ embeds: [buildDMDaEmbed({ action: "Warning", reason, pointsAfter })] });
    } catch {}

    // Log in channel
    const logChannel = await interaction.guild.channels.fetch(DA_LOG_CHANNEL_ID).catch(() => null);
    if (logChannel && logChannel.isTextBased()) {
      await logChannel.send({ embeds: [buildDALogEmbed({
        action: "Warning",
        target,
        reason,
        moderatorTag: interaction.user.tag,
        pointsAfter,
        pointsDelta: POINTS.warn
      })] });
    }

    // Reply
    await interaction.reply({ content: `Warned ${target.tag}. Total points: ${pointsAfter}.`, ephemeral: true });

    interaction.client.emit("pointsUpdated", { guild: interaction.guild, targetUser: target, moderatorTag: interaction.user.tag, reason, pointsAfter });
  }
};
