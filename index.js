require('dotenv').config();
const express = require('express');
const { Client, GatewayIntentBits, SlashCommandBuilder, PermissionFlagsBits, Events, ActivityType } = require('discord.js');

const app = express();
const port = process.env.PORT || 3000;
app.get('/', (req, res) => res.send('Bot is Running!'));
app.listen(port, () => console.log(`🌐 السيرفر يعمل على المنفذ: ${port}`));

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ],
});

let botSettings = { enabled: false, channelId: null, imageUrl: null };

client.once(Events.ClientReady, async (c) => {
    console.log(`✅✅✅ تم تسجيل الدخول بنجاح باسم: ${c.user.tag}`);
    client.user.setActivity('by b9r2', { type: ActivityType.Watching });
    
    const settings = new SlashCommandBuilder()
        .setName('settings')
        .setDescription('إعدادات الرد التلقائي')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addStringOption(o => o.setName('status').setDescription('تفعيل/إطفاء').setRequired(true).addChoices({name:'تفعيل',value:'on'},{name:'إطفاء',value:'off'}))
        .addChannelOption(o => o.setName('channel').setDescription('حدد الروم'))
        .addAttachmentOption(o => o.setName('image').setDescription('ارفع الصورة'));

    const uptime = new SlashCommandBuilder().setName('uptime').setDescription('مدة التشغيل');

    try {
        await client.application.commands.set([settings, uptime]);
        console.log('Successfully registered slash commands');
    } catch (e) { console.error('Error registering commands:', e); }
});

// نظام الرد
client.on(Events.MessageCreate, async m => {
    if (m.author.bot || !botSettings.enabled || m.channel.id !== botSettings.channelId || !botSettings.imageUrl) return;
    try { await m.reply({ files: [botSettings.imageUrl] }); } catch (e) { console.error(e); }
});

// التعامل مع الأوامر
client.on(Events.InteractionCreate, async i => {
    if (!i.isChatInputCommand()) return;
    if (i.commandName === 'settings') {
        botSettings.enabled = i.options.getString('status') === 'on';
        const ch = i.options.getChannel('channel');
        const img = i.options.getAttachment('image');
        if (ch) botSettings.channelId = ch.id;
        if (img) botSettings.imageUrl = img.url;
        await i.reply({ content: `✅ تم التحديث!`, ephemeral: true });
    }
    if (i.commandName === 'uptime') {
        let s = Math.floor(client.uptime / 1000);
        let m = Math.floor(s / 60); s %= 60;
        let h = Math.floor(m / 60); m %= 60;
        let d = Math.floor(h / 24); h %= 24;
        await i.reply({ content: `🕒 وقت التشغيل: ${d} يوم، ${h} ساعة، ${m} دقيقة`, ephemeral: true });
    }
});

// فحص التوكن قبل محاولة الدخول
if (!process.env.TOKEN) {
    console.error("❌ خطأ قاتل: لم يتم العثور على متغير TOKEN في إعدادات Render!");
} else {
    client.login(process.env.TOKEN).catch(err => {
        console.error("❌ فشل تسجيل الدخول إلى ديسكورد:");
        console.error(err.message);
    });
            }
                      
