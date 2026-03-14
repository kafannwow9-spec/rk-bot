require('dotenv').config();
const express = require('express');
const { 
    Client, 
    GatewayIntentBits, 
    SlashCommandBuilder, 
    PermissionFlagsBits, 
    Events,
    ActivityType // إضافة هذا النوع للتحكم في الحالة
} = require('discord.js');

// --- إعداد سيرفر الويب لإبقاء البوت حياً ---
const app = express();
const port = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('✅ البوت شغال والحالة: Watching by b9r2');
});

app.listen(port, () => {
  console.log(`🌐 السيرفر يعمل على المنفذ: ${port}`);
});
// ---------------------------------------

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ],
});

let botSettings = {
    enabled: false,
    channelId: null,
    imageUrl: null
};

client.once(Events.ClientReady, async (c) => {
    console.log(`✅ سجلت الدخول باسم ${c.user.tag}`);

    // --- ضبط حالة البوت (Watching by b9r2) ---
    client.user.setActivity('by b9r2', { type: ActivityType.Watching });
    
    // تعريف الأوامر
    const settingsCommand = new SlashCommandBuilder()
        .setName('settings')
        .setDescription('إعدادات الرد التلقائي')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addStringOption(option =>
            option.setName('status')
                .setDescription('تفعيل أو إطفاء النظام')
                .setRequired(true)
                .addChoices(
                    { name: 'تفعيل', value: 'on' },
                    { name: 'إطفاء', value: 'off' },
                ))
        .addChannelOption(option =>
            option.setName('channel')
                .setDescription('حدد الروم'))
        .addAttachmentOption(option =>
            option.setName('image')
                .setDescription('ارفع الصورة من الاستوديو'));

    const uptimeCommand = new SlashCommandBuilder()
        .setName('uptime')
        .setDescription('مدة تشغيل البوت');

    await client.application.commands.set([settingsCommand, uptimeCommand]);
});

client.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === 'settings') {
        const status = interaction.options.getString('status');
        const channel = interaction.options.getChannel('channel');
        const attachment = interaction.options.getAttachment('image');

        botSettings.enabled = (status === 'on');
        if (channel) botSettings.channelId = channel.id;
        if (attachment) botSettings.imageUrl = attachment.url;

        await interaction.reply({ 
            content: `⚙️ **تم تحديث الإعدادات!**\nالحالة: ${botSettings.enabled ? '🟢 مفعل' : '🔴 معطل'}`, 
            ephemeral: true 
        });
    }

    if (interaction.commandName === 'uptime') {
        let totalSeconds = (client.uptime / 1000);
        let months = Math.floor(totalSeconds / 2592000);
        totalSeconds %= 2592000;
        let days = Math.floor(totalSeconds / 86400);
        totalSeconds %= 86400;
        let hours = Math.floor(totalSeconds / 3600);
        totalSeconds %= 3600;
        let minutes = Math.floor(totalSeconds / 60);
        let seconds = Math.floor(totalSeconds % 60);

        await interaction.reply({ 
            content: `🕒 **مدة التشغيل:** \`${months} شهر، ${days} يوم، ${hours} س، ${minutes} د، ${seconds} ث\``, 
            ephemeral: true 
        });
    }
});

client.on(Events.MessageCreate, async message => {
    if (message.author.bot) return; 
    if (!botSettings.enabled || !botSettings.channelId || !botSettings.imageUrl) return;

    if (message.channel.id === botSettings.channelId) {
        try {
            await message.reply({ files: [botSettings.imageUrl] });
        } catch (error) {
            console.error('Error sending image:', error);
        }
    }
});

client.login(process.env.TOKEN).catch(err => {
    console.error("❌ فشل تسجيل الدخول: " + err.message);
});
