import "dotenv/config";
import { Client, Collection, Events, GatewayIntentBits, Partials, REST, Routes, PermissionFlagsBits, ActivityType } from "discord.js";
import { readdirSync } from "fs";
import { join } from "path";
import { addPoints, getPoints } from "./utils/pointsStore.js";
import { BAN_THRESHOLD, DA_LOG_CHANNEL_ID } from "./config.js";
import { buildDALogEmbed, buildDMDaEmbed } from "./utils/embeds.js";

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages
  ],
  partials: [Partials.Channel]
});

client.commands = new Collection();

// Load commands
const commandsPath = join(process.cwd(), "src", "commands");
for (const file of readdirSync(commandsPath).filter(f => f.endsWith(".js"))) {
  const { default: command } = await import(join(commandsPath, file).replace(/\\/g, "/"));
  client.commands.set(command.data.name, command);
}

client.once(Events.ClientReady, c => {
  console.log(`Logged in as ${c.user.tag}`);
  c.user.setPresence({ activities: [{ name: "Trail Guard", type: ActivityType.Watching }], status: "online" });
});

client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isChatInputCommand()) return;
  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction, client);
  } catch (error) {
    console.error(error);
    if (interaction.deferred || interaction.replied) {
      await interaction.followUp({ content: "There was an error while executing this command.", ephemeral: true });
    } else {
      await interaction.reply({ content: "There was an error while executing this command.", ephemeral: true });
    }
  }
});

// Global listener to auto-ban when crossing threshold after any command that modifies points
client.on("pointsUpdated", async ({ guild, targetUser, moderatorTag, reason, pointsAfter }) => {
  try {
    if (pointsAfter >= BAN_THRESHOLD) {
      const member = await guild.members.fetch(targetUser.id).catch(() => null);
      if (member && member.bannable) {
        // DM the user prior to ban
        try {
          await targetUser.send({ embeds: [buildDMDaEmbed({ action: "Ban", reason: `Auto-ban at ${BAN_THRESHOLD} points`, pointsAfter })] });
        } catch {}
        await member.ban({ reason: `Auto-ban at ${BAN_THRESHOLD} points` });
        const logChannel = await guild.channels.fetch(DA_LOG_CHANNEL_ID).catch(() => null);
        if (logChannel && logChannel.isTextBased()) {
          await logChannel.send({ embeds: [buildDALogEmbed({
            action: "Ban",
            target: targetUser,
            reason: `Auto-ban at ${BAN_THRESHOLD} points`,
            moderatorTag,
            pointsAfter,
            pointsDelta: 0
          })] });
        }
      }
    }
  } catch (e) {
    console.error("Auto-ban check failed:", e);
  }
});

client.login(process.env.DISCORD_TOKEN);
