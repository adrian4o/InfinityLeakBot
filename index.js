import {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  REST,
  Routes,
  SlashCommandBuilder
} from "discord.js";
import dotenv from "dotenv";
import fs from "fs";
dotenv.config();

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages]
});

client.once("ready", () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
});

// Define /leak command
const leakCommand = new SlashCommandBuilder()
  .setName("leak")
  .setDescription("Post a new Infinity Leak embed (Leakers only)")
  .addStringOption(opt =>
    opt.setName("name").setDescription("Resource name").setRequired(true)
  )
  .addStringOption(opt =>
    opt.setName("description").setDescription("Resource description").setRequired(true)
  )
  .addStringOption(opt =>
    opt.setName("preview").setDescription("Preview link (YouTube, etc.)").setRequired(true)
  )
  .addStringOption(opt =>
    opt.setName("download").setDescription("Download link").setRequired(true)
  )
  .addStringOption(opt =>
    opt.setName("image").setDescription("Image URL (optional)").setRequired(false)
  );

// Register the command instantly
async function registerGuildCommand() {
  const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);
  try {
    console.log("⏳ Registering /leak command...");
    await rest.put(
      Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
      { body: [leakCommand.toJSON()] }
    );
    console.log("✅ /leak command registered!");
  } catch (err) {
    console.error("❌ Error registering command:", err);
  }
}
registerGuildCommand();

// Handle /leak command
client.on("interactionCreate", async interaction => {
  if (!interaction.isChatInputCommand() || interaction.commandName !== "leak") return;

  // ✅ Check for Leaker role
  const leakerRole = interaction.guild.roles.cache.find(r => r.name === "Leaker");
  if (!leakerRole) {
    return interaction.reply({
      content: "⚠️ The `Leaker` role doesn’t exist in this server!",
      ephemeral: true
    });
  }

  if (!interaction.member.roles.cache.has(leakerRole.id)) {
    return interaction.reply({
      content: "🚫 Only members with the **Leaker** role can use this command.",
      ephemeral: true
    });
  }

  // Get command data
  const resourceName = interaction.options.getString("name");
  const description = interaction.options.getString("description");
  const previewLink = interaction.options.getString("preview");
  const downloadLink = interaction.options.getString("download");
  const imageLink = interaction.options.getString("image");

  // Build embed
  const embed = new EmbedBuilder()
    .setColor("#5865F2")
    .setAuthor({
      name: "Infinity Leak",
      iconURL: "https://cdn.discordapp.com/emojis/your_logo_here.png"
    })
    .setDescription(
      `**@everyone @here**\n\n` +
      `**${resourceName}**\n${description}\n\n` +
      `**[PREVIEW]:** [CLICK ME](${previewLink})\n` +
      `**[DOWNLOAD]:** [CLICK ME](${downloadLink})`
    )
    .setFooter({
      text: "Infinity Leak © 2025",
      iconURL: "https://cdn.discordapp.com/emojis/your_footer_icon.png"
    })
    .setTimestamp();

  if (imageLink) embed.setImage(imageLink);

  // Send embed
  await interaction.reply({
    content: "@everyone @here",
    embeds: [embed],
    allowedMentions: { parse: ["everyone"] }
  });

  // Log to file
  const log = `[${new Date().toLocaleString()}] ${interaction.user.tag} posted: ${resourceName}\nDescription: ${description}\nPreview: ${previewLink}\nDownload: ${downloadLink}\nImage: ${imageLink || "none"}\n\n`;
  fs.appendFileSync("leaks.txt", log);
  console.log(`🧾 Logged leak: ${resourceName}`);
});

client.login(process.env.TOKEN);


