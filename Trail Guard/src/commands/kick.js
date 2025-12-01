import { SlashCommandBuilder, PermissionFlagsBits } from "discord.js";
import { POINTS, DA_LOG_CHANNEL_ID } from "../config.js";
import { addPoints } from "../utils/pointsStore.js";
import { buildDALogEmbed, buildDMDaEmbed } from "../utils/embeds.js";
import { ensureStaffOrAdmin } from "../utils/permissions.js";

export default {
  data: new SlashCommandBuilder()
    .setName("kick")
    .setDescription("Kick a user (adds points)")
    .addUserOption(o => o.setName("user").setDescription("User to kick").setRequired(true))
    .addStringOption(o => o.setName("reason").setDescription("Reason for kick").setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),

  async execute(interaction) {
    try {
      ensureStaffOrAdmin(interaction);
    } catch (e) {
      return interaction.reply({ content: e.message, ephemeral: true });
    }
    const target = interaction.options.getUser("user", true);
    const reason = interaction.options.getString("reason") || "No reason provided";

    const member = await interaction.guild.members.fetch(target.id).catch(() => null);
    if (!member) return interaction.reply({ content: "User not found in this guild.", ephemeral: true });
    if (!member.kickable) return interaction.reply({ content: "I cannot kick this member.", ephemeral: true });

    // Add points first so DM reflects correct total
    const pointsAfter = addPoints(target.id, POINTS.kick);

    // DM user
    try {
      await target.send({ embeds: [buildDMDaEmbed({ action: "Kick", reason, pointsAfter })] });
    } catch {}

    // Then perform kick
    await member.kick(reason).catch(() => null);

    // Log in channel
    const logChannel = await interaction.guild.channels.fetch(DA_LOG_CHANNEL_ID).catch(() => null);
    if (logChannel && logChannel.isTextBased()) {
      await logChannel.send({ embeds: [buildDALogEmbed({
        action: "Kick",
        target,
        reason,
        moderatorTag: interaction.user.tag,
        pointsAfter,
        pointsDelta: POINTS.kick
      })] });
    }

    await interaction.reply({ content: `Kicked ${target.tag}. Total points: ${pointsAfter}.`, ephemeral: true });

    interaction.client.emit("pointsUpdated", { guild: interaction.guild, targetUser: target, moderatorTag: interaction.user.tag, reason, pointsAfter });
  }
};
