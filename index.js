const express = require('express');
const { GetObjectCommand, S3Client } = require ("@aws-sdk/client-s3");

const path = require('path');
const fs = require('fs');

const qrcode = require('qrcode-terminal');
var qr = require('qr-image');

const {Client, LocalAuth, NoAuth, MessageMedia} = require('whatsapp-web.js');
const messagesRepository = require("./services/messagesRepository");

const client = new Client({
    authStrategy: new NoAuth(),
    puppeteer: {
		args: ['--no-sandbox'],
	}
});

const clientId = null;

client.on('qr', qrsata => {
    const qr_svg = qr.image(qrsata, {type: 'svg'});
    qr_svg.pipe(require('fs').createWriteStream('qr.svg'));
    console.log('new qr');
});

let interval = null;

const downloadFile = () => {
    const s3client = new S3Client({
        region: "us-east-1",
        credentials: {
            accessKeyId: 'AKIAVLXMP2ZYUBQCOTLX',
            secretAccessKey: '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'
        }
    });

    const command = new GetObjectCommand({
        Bucket: "app-marketing-bucket",
        Key: `${clientId}.jpeg`,
        Body: blob,
    });

    try {
        const response = s3client.send(command);
        console.log("descargada cargada correctamente.");
    } catch (err) {
        console.error(err);
    }
}

client.on('ready', () => {
     console.log('Client is ready!');
     downloadFile();

     interval =  setInterval(() => {
        console.log('Ejecution start');
        
        messagesRepository.getMessage().then((msg) => {
            console.log(msg);
            if (!msg.id) return;
            const number = msg.number;
            const text = msg.message;

            const chatId = number.substring(1) + "@c.us";
            const media = MessageMedia.fromFilePath(`${__dirname}/promo14.jpeg`);

            client.sendMessage(chatId, media, {caption: text}).then(r => {
                let newMessage = {
                    ...msg,
                    status: "DELIVERED"
                }
                messagesRepository.updateMessage(newMessage).then(r => {});
            }).catch((err) => {
                console.log(err);
            });
        });
    }, 1000); 
});


client.on('disconnected', ()=> {
    clearInterval(interval);
    interval = 0; 
    console.log('Client Disconecte');
});


const app = express()
const port = 3009


app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname+'/index.html'));
});

app.get('/qr', (req, res) => {
    res.sendFile(path.join(__dirname+'/qr.svg'));
});

app.get('/init', (req, res) => {
    clientId = req.query.clientId;
    console.log('clientId', clientId);

    client.initialize().then(()=>{});
    res.send('start')
})

app.get('/stop', (req, res) => {
    try {
        fs.unlinkSync(path.join(__dirname+'/qr.svg'));
    } catch (err) {
        console.log('Error stoping', err);
    } finally {
        client.destroy();
        clearInterval(interval);
        interval = 0; 
        res.send('stop')
    }
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
