import { EmbedBuilder, Colors } from "discord.js";
import { ISSUER_NAME } from "../config.js";

export function buildDALogEmbed({ action, target, reason, moderatorTag, pointsAfter, pointsDelta }) {
  const color = action === "Ban" ? Colors.Red : action === "Mute" ? Colors.Yellow : Colors.Blurple;
  return new EmbedBuilder()
    .setTitle(`Disciplinary Action Issued: ${action}`)
    .setColor(color)
    .addFields(
      { name: "Target", value: `${target.tag} (${target.id})`, inline: false },
      { name: "Issued By", value: moderatorTag, inline: true },
      { name: "Issuer (Display)", value: ISSUER_NAME, inline: true },
      { name: "Reason", value: reason || "No reason provided", inline: false },
      { name: "Points Change", value: `${pointsDelta >= 0 ? "+" : ""}${pointsDelta}`, inline: true },
      { name: "Total Points", value: `${pointsAfter}`, inline: true }
    )
    .setTimestamp();
}

export function buildDMDaEmbed({ action, reason, pointsAfter }) {
  const color = action === "Ban" ? Colors.Red : action === "Mute" ? Colors.Yellow : Colors.Blurple;
  return new EmbedBuilder()
    .setTitle("Disciplinary Action Notice")
    .setColor(color)
    .setDescription(
      [
        `A disciplinary action has been issued by **${ISSUER_NAME}**.`,
        `Action: **${action}**`,
        `Reason: ${reason || "No reason provided"}`,
        `Your current points: **${pointsAfter}**`,
        "If you believe this was unjust, you may appeal by opening a ticket."
      ].join("\n")
    )
    .setTimestamp();
}
