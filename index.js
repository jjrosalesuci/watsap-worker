const express = require('express');
const path = require('path');
const fs = require('fs');

const qrcode = require('qrcode-terminal');
var qr = require('qr-image');

const {Client, LocalAuth, NoAuth, MessageMedia} = require('whatsapp-web.js');
const messagesRepository = require("./services/messagesRepository");

const client = new Client({
    authStrategy: new NoAuth(),
});

client.on('qr', qrsata => {
    // qrcode.generate(qr, {small: true});s
    var qr_svg = qr.image(qrsata, { type: 'svg' });
    qr_svg.pipe(require('fs').createWriteStream('qr.svg'));
    console.log('new qr');
});

let interval = null;
client.on('ready', () => {
     console.log('Client is ready!');
     interval =  setInterval(() => {
        console.log('Ejecution start');

        messagesRepository.getMessage().then((msg) => {
            console.log(msg);
            if (!msg.id) return;
            const number = msg.number;
            const text = msg.message;

            const chatId = number.substring(1) + "@c.us";
            const media = MessageMedia.fromFilePath(`${__dirname}/promo.jpeg`);

            client.sendMessage(chatId, media, {caption: text}).then(r => {
                let newMessage = {
                    ...msg,
                    status: "DELIVERED"
                }
                messagesRepository.updateMessage(newMessage).then(r => {});
            }).catch((err) => {
                console.log(err)
                let newMessage = {
                    ...msg,
                    status: "ERROR"
                }
                messagesRepository.updateMessage(newMessage).then(r => {});
            });
        });
    }, 500); 
});


client.on('disconnected', ()=> {
    clearInterval(interval);
    interval = 0; 
    console.log('Client Disconecte');
});


const app = express()
const port = 3000


app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname+'/index.html'));
});

app.get('/qr', (req, res) => {
    res.sendFile(path.join(__dirname+'/qr.svg'));
});

app.get('/init', (req, res) => {
    client.initialize();
    res.send('start')
})

app.get('/stop', (req, res) => {
    fs.unlinkSync(path.join(__dirname+'/qr.svg'));
    client.destroy();
    clearInterval(interval);
    interval = 0; 
    res.send('stop')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
