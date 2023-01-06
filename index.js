const { Client, LocalAuth, Buttons, List } = require("whatsapp-web.js");
const qrcode = require("qrcode-terminal");
const fs = require("fs");
const { exit } = require("process");

const client = new Client({
    authStrategy: new LocalAuth(),
});

client.initialize();

client.on('loading_screen', (percent, message) => {
    console.log('LOADING SCREEN', percent, message);
});

client.on("qr", (qr) => {
    console.clear();
    qrcode.generate(qr, { small: true });
});

client.on("authenticated", (session) => {
    console.clear();
    console.log("Client is authenticated!");
});

client.on("ready", () => {
    console.log("Client is ready!");
});


const indexData = JSON.parse(fs.readFileSync('index.json'));
client.on('message', async msg => {
    try {
        console.log("Tipe pesan: " + msg.type)
        console.log("Dari " + msg.from + ":\n" + msg.body);
        for (data of indexData) {
            if (msg.body.startsWith(data.clue)) {
                if (data.quotedMessage) {
                    await msg.reply(data.quotedMessage);
                } else {
                    await msg.reply(data.answer);
                }
                break;
            }
        }

        if (msg.body.startsWith('!save')) {
            const messageParts = msg.body.split(' ');
            const clue = '#' + messageParts[1];

            const x = messageParts.slice(2).join(' ');
            const answer = '*-* ' + x;
            const existingItem = indexData.find(item => item.clue === clue);
            // cek apakah pesan memuat quotedMessage
            if (msg.hasQuotedMsg === true) {
                // ambil quotedMessage
                const quotedMessage = msg.getQuotedMessage();
                // simpan informasi quotedMessage ke dalam index.json
                const existingItem = indexData.find(item => item.clue === clue);
                if (existingItem) {
                    existingItem.quotedMessage = quotedMessage;
                    fs.writeFileSync('index.json', JSON.stringify(indexData, null, 2));
                    msg.reply(`Isi untuk index ${clue} telah diperbarui`);
                } else {
                    indexData.push({ clue, quotedMessage });
                    fs.writeFileSync('index.json', JSON.stringify(indexData, null, 2));
                    msg.reply(`Index ${clue} berhasil disimpan`);
                }
            }
            if (existingItem) {
                let newAnswer = answer;
                existingItem.answer += `\n${newAnswer}`;
                fs.writeFileSync('index.json', JSON.stringify(indexData, null, 2));
                msg.reply(`Isi untuk index ${clue} telah diperbarui`);
            } else {
                indexData.push({ clue, answer });
                fs.writeFileSync('index.json', JSON.stringify(indexData, null, 2));
                msg.reply(`Index ${clue} berhasil disimpan`);
            }

        }
        if (msg.body.startsWith('!del-index')) {
            const messageParts = msg.body.split(' ');
            const clue = '#' + messageParts[1];
            const index = indexData.findIndex(item => item.clue === clue);
            if (index === -1) {
                msg.reply(`Index ${clue} tidak ditemukan`);
            } else {
                indexData.splice(index, 1);
                fs.writeFileSync('index.json', JSON.stringify(indexData, null, 2));
                msg.reply(`Index ${clue} berhasil dihapus`);
            }
        }
        if (msg.body === '!pin') {
            const chat = await msg.getChat();
            await chat.pin();
        }
        if (msg.body.startsWith('!help')) {
            await msg.reply('Untuk menyimpan jawaban, ketik:\n*!save* *nama_index* *isi_index*\n\nUntuk memanggil jawaban, ketik:\n*#nama_index*\n\nuntuk melihat semua index, ketik:\n*!index*');
        }
        if (msg.body.startsWith('!index')) {
            const clues = indexData.map(item => item.clue);
            const cluesString = clues.join('\n');
            msg.reply(`Daftar clue:\n${cluesString}`);
        }
    } catch (error) {
        console.error(error);
    }
});


fs.watchFile('index.json', (curr, prev) => {
    console.log('File index.json telah diubah.');
    const indexData = JSON.parse(fs.readFileSync('index.json'));
});
