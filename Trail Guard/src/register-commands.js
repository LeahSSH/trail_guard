import "dotenv/config";
import { REST, Routes } from "discord.js";
import { readdirSync } from "fs";
import { join } from "path";

async function main() {
  const commands = [];
  const commandsPath = join(process.cwd(), "src", "commands");
  for (const file of readdirSync(commandsPath).filter(f => f.endsWith(".js"))) {
    const { default: command } = await import(join(commandsPath, file).replace(/\\/g, "/"));
    commands.push(command.data.toJSON());
  }

  const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN);

  try {
    if (process.env.GUILD_ID) {
      console.log(`Registering ${commands.length} guild commands to guild ${process.env.GUILD_ID}...`);
      const data = await rest.put(
        Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
        { body: commands }
      );
      console.log(`Successfully registered ${data.length} guild commands.`);
    } else {
      console.log(`Registering ${commands.length} global commands...`);
      const data = await rest.put(
        Routes.applicationCommands(process.env.CLIENT_ID),
        { body: commands }
      );
      console.log(`Successfully registered ${data.length} global commands.`);
    }
  } catch (error) {
    console.error(error);
  }
}

main();
