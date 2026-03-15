const { 
    Client, 
    GatewayIntentBits, 
    PermissionsBitField, 
    SlashCommandBuilder, 
    REST, 
    Routes 
} = require('discord.js');
const express = require('express');

// --- سيرفر الويب للبقاء حياً ---
const app = express();
app.get('/', (req, res) => res.send('Bot is Running!'));
app.listen(3000, () => console.log('✅ Server is ready on port 3000'));

// --- جلب التوكن والآيدي من إعدادات Render ---
// استخدمنا .trim() لإزالة أي فراغات قد تسبب الخطأ
const TOKEN = process.env.TOKEN ? process.env.TOKEN.trim() : null;
const CLIENT_ID = process.env.CLIENT_ID ? process.env.CLIENT_ID.trim() : null;

if (!TOKEN || TOKEN.includes("ضع_") || !CLIENT_ID) {
    console.error("❌ خطأ قاتل: التوكن أو الآيدي غير موجود أو غير صحيح!");
    console.error("تأكد من إضافتهم في Environment Variables في Render باسم TOKEN و CLIENT_ID");
    process.exit(1);
}

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

let startTime = Date.now();
let botConfig = { enabled: false, channelId: null, imageUrl: null };

// أوامر السلاش
const commands = [
    new SlashCommandBuilder()
        .setName('config')
        .setDescription('إعداد النظام')
        .addBooleanOption(opt => opt.setName('تفعيل').setDescription('تفعيل أو إطفاء').setRequired(true))
        .addChannelOption(opt => opt.setName('الروم').setDescription('اختر الروم'))
        .addAttachmentOption(opt => opt.setName('صورة').setDescription('ارفع الصورة')),
    new SlashCommandBuilder()
        .setName('uptime')
        .setDescription('وقت التشغيل')
].map(c => c.toJSON());

// تسجيل الأوامر
const rest = new REST({ version: '10' }).setToken(TOKEN);

(async () => {
    try {
        console.log('⏳ جاري تسجيل أوامر السلاش...');
        await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands });
        console.log('✅ تم تسجيل الأوامر بنجاح!');
    } catch (error) {
        console.error('❌ فشل تسجيل الأوامر:', error);
    }
})();

// التفاعل مع الأوامر
client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === 'uptime') {
        const diff = Math.floor((Date.now() - startTime) / 1000);
        const days = Math.floor(diff / 86400);
        const hours = Math.floor((diff % 86400) / 3600);
        const mins = Math.floor((diff % 3600) / 60);
        const secs = diff % 60;
        await interaction.reply({
            content: `⏳ متصل منذ: ${days} يوم و ${hours} ساعة و ${mins} دقيقة و ${secs} ثانية`,
            ephemeral: true
        });
    }

    if (interaction.commandName === 'config') {
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return interaction.reply({ content: '❌ للأدمن فقط', ephemeral: true });
        }
        botConfig.enabled = interaction.options.getBoolean('تفعيل');
        const channel = interaction.options.getChannel('الروم');
        const image = interaction.options.getAttachment('صورة');
        if (channel) botConfig.channelId = channel.id;
        if (image) botConfig.imageUrl = image.url;
        await interaction.reply({ content: `✅ تم التحديث! الحالة: ${botConfig.enabled ? 'مفعل' : 'معطل'}`, ephemeral: true });
    }
});

// الإرسال التلقائي
client.on('messageCreate', async msg => {
    if (msg.author.bot) return;
    if (botConfig.enabled && msg.channel.id === botConfig.channelId && botConfig.imageUrl) {
        msg.channel.send({ files: [botConfig.imageUrl] }).catch(() => {});
    }
});

client.login(TOKEN).catch(err => console.error("❌ فشل تسجيل الدخول:", err));
