const { 
    Client, 
    GatewayIntentBits, 
    PermissionsBitField, 
    SlashCommandBuilder, 
    REST, 
    Routes,
    ActivityType 
} = require('discord.js');
const express = require('express');

// 1. سيرفر الويب
const app = express();
app.get('/', (req, res) => res.send('Bot is Running!'));
app.listen(3000, () => console.log('✅ Web Server Online'));

// 2. جلب التوكن والآيدي
const TOKEN = process.env.TOKEN?.trim();
const CLIENT_ID = process.env.CLIENT_ID?.trim();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

let startTime = Date.now();
let botConfig = { enabled: false, channelId: null, imageUrl: null };

// 3. تعريف الأوامر (تأكد من الأسماء بالإنجليزية لتجنب المشاكل)
const commands = [
    new SlashCommandBuilder()
        .setName('config')
        .setDescription('إعداد نظام الإرسال التلقائي')
        .addBooleanOption(opt => opt.setName('status').setDescription('تفعيل أو إطفاء').setRequired(true))
        .addChannelOption(opt => opt.setName('channel').setDescription('اختر الروم'))
        .addAttachmentOption(opt => opt.setName('image').setDescription('ارفع الصورة')),
    new SlashCommandBuilder()
        .setName('uptime')
        .setDescription('وقت تشغيل البوت')
].map(c => c.toJSON());

// 4. حدث تشغيل البوت (Ready)
client.once('ready', async () => {
    console.log(`✅ Logged in as ${client.user.tag}`);
    
    // وضع حالة "Watching"
    client.user.setPresence({
        activities: [{ name: `Messages`, type: ActivityType.Watching }],
        status: 'online',
    });

    // تسجيل الأوامر
    const rest = new REST({ version: '10' }).setToken(TOKEN);
    try {
        console.log('⏳ جاري تحديث أوامر السلاش...');
        await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands });
        console.log('✅ تم تحديث الأوامر بنجاح!');
    } catch (error) {
        console.error('❌ خطأ في تسجيل الأوامر:', error);
    }
});

// 5. التفاعل مع الأوامر
client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    try {
        if (interaction.commandName === 'uptime') {
            const diff = Math.floor((Date.now() - startTime) / 1000);
            const days = Math.floor(diff / 86400);
            const hours = Math.floor((diff % 86400) / 3600);
            const mins = Math.floor((diff % 3600) / 60);
            const secs = diff % 60;
            
            await interaction.reply({
                content: `⏳ مدة التشغيل:\n${days} يوم، ${hours} ساعة، ${mins} دقيقة، ${secs} ثانية`,
                ephemeral: true
            });
        }

        if (interaction.commandName === 'config') {
            if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
                return interaction.reply({ content: '❌ للأدمن فقط', ephemeral: true });
            }

            const status = interaction.options.getBoolean('status');
            const channel = interaction.options.getChannel('channel');
            const image = interaction.options.getAttachment('image');

            botConfig.enabled = status;
            if (channel) botConfig.channelId = channel.id;
            if (image) botConfig.imageUrl = image.url;

            await interaction.reply({
                content: `⚙️ **تم التحديث:**\nالحالة: ${status ? '✅ مفعل' : '❌ معطل'}\nالروم: <#${botConfig.channelId || 'غير محدد'}>\nالصورة: ${botConfig.imageUrl ? '✅ تم الحفظ' : '⚠️ لا توجد صورة'}`,
                ephemeral: true
            });
        }
    } catch (error) {
        console.error(error);
        await interaction.reply({ content: '❌ حدث خطأ أثناء تنفيذ الأمر', ephemeral: true }).catch(() => {});
    }
});

// 6. الإرسال التلقائي
client.on('messageCreate', async msg => {
    if (msg.author.bot || !botConfig.enabled) return;
    if (msg.channel.id === botConfig.channelId && botConfig.imageUrl) {
        msg.channel.send({ files: [botConfig.imageUrl] }).catch(err => console.log("خطأ في إرسال الصورة:", err));
    }
});

client.login(TOKEN);
