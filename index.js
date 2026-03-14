require('dotenv').config();
const express = require('express');
const { 
Client, 
GatewayIntentBits, 
SlashCommandBuilder, 
PermissionFlagsBits, 
Events, 
ActivityType 
} = require('discord.js');

const app = express();
const port = process.env.PORT || 3000;

app.get('/', (req, res) => res.send('Bot is Running!'));

app.listen(port, () => {
console.log(`🌐 السيرفر يعمل على المنفذ: ${port}`);
});

/* =======================
   تحقق من التوكن
======================= */

if (!process.env.TOKEN) {
console.error("❌ لا يوجد TOKEN في ملف .env");
process.exit(1);
}

/* =======================
   إنشاء البوت
======================= */

const client = new Client({
intents: [
GatewayIntentBits.Guilds,
GatewayIntentBits.GuildMessages,
GatewayIntentBits.MessageContent
]
});

let botSettings = {
enabled: false,
channelId: null,
imageUrl: null
};

/* =======================
   Ready
======================= */

client.once(Events.ClientReady, async (c) => {

console.log(`✅ تم تسجيل الدخول باسم: ${c.user.tag}`);

client.user.setActivity('by b9r2', {
type: ActivityType.Watching
});

/* =======================
   الأوامر
======================= */

const settings = new SlashCommandBuilder()
.setName('settings')
.setDescription('إعدادات الرد التلقائي')
.setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
.addStringOption(o =>
o.setName('status')
.setDescription('تفعيل أو إطفاء')
.setRequired(true)
.addChoices(
{name:'تفعيل',value:'on'},
{name:'إطفاء',value:'off'}
))
.addChannelOption(o =>
o.setName('channel')
.setDescription('حدد الروم')
)
.addAttachmentOption(o =>
o.setName('image')
.setDescription('ارفع صورة')
);

const uptime = new SlashCommandBuilder()
.setName('uptime')
.setDescription('مدة تشغيل البوت');

try {

await client.application.commands.set([
settings,
uptime
]);

console.log("✅ تم تسجيل الأوامر");

} catch (err) {

console.error("❌ فشل تسجيل الأوامر");
console.error(err);

}

});

/* =======================
   الرد التلقائي
======================= */

client.on(Events.MessageCreate, async (msg) => {

if (msg.author.bot) return;
if (!botSettings.enabled) return;
if (!botSettings.channelId) return;
if (!botSettings.imageUrl) return;

if (msg.channel.id !== botSettings.channelId) return;

try {

await msg.reply({
files: [botSettings.imageUrl]
});

} catch (err) {

console.error("❌ فشل الرد التلقائي");
console.error(err);

}

});

/* =======================
   التفاعل مع الأوامر
======================= */

client.on(Events.InteractionCreate, async (i) => {

if (!i.isChatInputCommand()) return;

if (i.commandName === "settings") {

const status = i.options.getString("status");
const channel = i.options.getChannel("channel");
const image = i.options.getAttachment("image");

botSettings.enabled = status === "on";

if (channel) botSettings.channelId = channel.id;
if (image) botSettings.imageUrl = image.url;

await i.reply({
content: "✅ تم تحديث الإعدادات",
ephemeral: true
});

}

if (i.commandName === "uptime") {

let seconds = Math.floor(client.uptime / 1000);

let minutes = Math.floor(seconds / 60);
seconds %= 60;

let hours = Math.floor(minutes / 60);
minutes %= 60;

let days = Math.floor(hours / 24);
hours %= 24;

await i.reply({
content: `🕒 وقت التشغيل: ${days} يوم ${hours} ساعة ${minutes} دقيقة`,
ephemeral: true
});

}

});

/* =======================
   أخطاء
======================= */

client.on("error", console.error);
process.on("unhandledRejection", console.error);

/* =======================
   تسجيل الدخول
======================= */

client.login(process.env.TOKEN)
.then(() => {
console.log("🔐 محاولة تسجيل الدخول...");
})
.catch(err => {
console.error("❌ فشل تسجيل الدخول");
console.error(err);
});
