import { SlashCommandBuilder, PermissionFlagsBits, ChannelType } from "discord.js";
import { ensureStaffOrAdmin } from "../utils/permissions.js";

export default {
  data: new SlashCommandBuilder()
    .setName("purge")
    .setDescription("Bulk delete a number of recent messages in this channel")
    .addIntegerOption(o => o.setName("count").setDescription("Number of messages to delete (1-100)").setRequired(true).setMinValue(1).setMaxValue(100))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

  async execute(interaction) {
    try {
      ensureStaffOrAdmin(interaction);
    } catch (e) {
      return interaction.reply({ content: e.message, ephemeral: true });
    }
    const count = interaction.options.getInteger("count", true);
    const channel = interaction.channel;
    if (!channel || !channel.isTextBased() || channel.type === ChannelType.DM) {
      return interaction.reply({ content: "This command can only be used in a server text channel.", ephemeral: true });
    }

    await interaction.deferReply({ ephemeral: true });

    const fetched = await channel.messages.fetch({ limit: count }).catch(() => null);
    if (!fetched) return interaction.editReply("Failed to fetch messages.");

    const toDelete = fetched.filter(m => (Date.now() - m.createdTimestamp) < 14 * 24 * 60 * 60 * 1000);
    const deleted = await channel.bulkDelete(toDelete, true).catch(() => null);

    await interaction.editReply(`Deleted ${deleted?.size ?? 0} messages.`);
  }
};
