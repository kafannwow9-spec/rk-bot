const { 
    Client, 
    GatewayIntentBits, 
    PermissionsBitField, 
    SlashCommandBuilder, 
    EmbedBuilder, 
    REST, 
    Routes 
} = require('discord.js');
const express = require('express');

// --- إعداد السيرفر (Port) ليبقى البوت يعمل ---
const app = express();
app.get('/', (req, res) => res.send('Bot is Online! ✅'));
app.listen(3000, () => console.log('Server is ready on port 3000'));

// --- إعدادات البوت ---
const TOKEN = 'ضع_توكن_بوتك_هنا';
const CLIENT_ID = 'ضع_آيدي_بوتك_هنا';

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

let startTime = Date.now();
let botConfig = {
    enabled: false,
    channelId: null,
    imageUrl: null
};

// --- تعريف أوامر السلاش ---
const commands = [
    new SlashCommandBuilder()
        .setName('config')
        .setDescription('إعداد نظام الإرسال التلقائي (للإدارة فقط)')
        .addBooleanOption(option => 
            option.setName('تفعيل').setDescription('تفعيل أو إطفاء النظام').setRequired(true))
        .addChannelOption(option => 
            option.setName('الروم').setDescription('اختر الروم المراد تفعيله').setRequired(false))
        .addAttachmentOption(option => 
            option.setName('صورة').setDescription('ارفع الصورة من الاستوديو').setRequired(false)),

    new SlashCommandBuilder()
        .setName('uptime')
        .setDescription('لمعرفة مدة تشغيل البوت')
].map(command => command.toJSON());

// --- تسجيل الأوامر ---
const rest = new REST({ version: '10' }).setToken(TOKEN);
(async () => {
    try {
        console.log('جاري تسجيل أوامر السلاش...');
        await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands });
        console.log('تم تسجيل الأوامr بنجاح!');
    } catch (error) {
        console.error(error);
    }
})();

// --- التفاعل مع الأوامر ---
client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    // أمر Uptime
    if (interaction.commandName === 'uptime') {
        const totalSeconds = Math.floor((Date.now() - startTime) / 1000);
        const months = Math.floor(totalSeconds / (30 * 24 * 3600));
        const days = Math.floor((totalSeconds % (30 * 24 * 3600)) / (24 * 3600));
        const hours = Math.floor((totalSeconds % (24 * 3600)) / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;

        await interaction.reply({
            content: `⏳ **مدة التشغيل:**\n📅 ${months} شهر، ${days} يوم\n⏰ ${hours} ساعة، ${minutes} دقيقة، ${seconds} ثانية`,
            ephemeral: true
        });
    }

    // أمر Config
    if (interaction.commandName === 'config') {
        // التحقق من صلاحية الإدارة
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return interaction.reply({ content: '❌ هذا الأمر للإداريين فقط!', ephemeral: true });
        }

        const status = interaction.options.getBoolean('تفعيل');
        const channel = interaction.options.getChannel('الروم');
        const image = interaction.options.getAttachment('صورة');

        botConfig.enabled = status;
        if (channel) botConfig.channelId = channel.id;
        if (image) botConfig.imageUrl = image.url;

        await interaction.reply({
            content: `✅ تم تحديث الإعدادات!\nالحالة: ${status ? 'مفعل' : 'معطل'}\nالروم: <#${botConfig.channelId || 'غير محدد'}>`,
            ephemeral: true
        });
    }
});

// --- نظام الإرسال التلقائي عند الكتابة ---
client.on('messageCreate', async message => {
    if (message.author.bot) return;

    if (botConfig.enabled && message.channel.id === botConfig.channelId && botConfig.imageUrl) {
        try {
            await message.channel.send({ files: [botConfig.imageUrl] });
        } catch (e) {
            console.error('Error sending image:', e);
        }
    }
});

client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

client.login(TOKEN);
