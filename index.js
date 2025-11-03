import {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  REST,
  Routes,
  SlashCommandBuilder,
  PermissionFlagsBits
} from "discord.js";
import dotenv from "dotenv";
import fs from "fs";
dotenv.config();

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages]
});

client.once("clientReady", () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
});

// Define /leak command
const leakCommand = new SlashCommandBuilder()
  .setName("leak")
  .setDescription("Post a new Infinity Leak embed (Admins only)")
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
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

// Register the command instantly in your server
async function registerGuildCommand() {
  const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);
  try {
    console.log("⏳ Registering /leak command to your server...");
    await rest.put(
      Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
      { body: [leakCommand.toJSON()] }
    );
    console.log("✅ /leak command registered instantly!");
  } catch (err) {
    console.error("❌ Error registering command:", err);
  }
}
registerGuildCommand();

// Handle the /leak command
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand() || interaction.commandName !== "leak") return;

  // Only allow admins
  if (!interaction.memberPermissions.has(PermissionFlagsBits.Administrator)) {
    return await interaction.reply({
      content: "❌ You don’t have permission to use this command.",
      ephemeral: true
    });
  }

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

  // Send embed + ping
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
