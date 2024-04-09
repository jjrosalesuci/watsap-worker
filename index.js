const express = require('express');
const path = require('path');
const fs = require('fs');
const { GetObjectCommand, S3Client } = require ("@aws-sdk/client-s3");

const qrcode = require('qrcode-terminal');
var qr = require('qr-image');
const short = require('short-uuid');

const {Client, LocalAuth, NoAuth, MessageMedia} = require('whatsapp-web.js');
const messagesRepository = require("./services/messagesRepository");

const wwebVersion = '2.2407.3';
const client = new Client({
    authStrategy: new NoAuth(),
    puppeteer: {
		args: ['--no-sandbox'],
	},
    webVersionCache: {
        type: 'remote',
        remotePath: `https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/${wwebVersion}.html`,
    },
});

client.on('qr', qrsata => {
    const qr_svg = qr.image(qrsata, {type: 'svg'});
    qr_svg.pipe(require('fs').createWriteStream('qr.svg'));
    console.log('new qr');
});

let interval = null;
let clientId = null;

// Image
const downloadFile = async (clientId) => {
    console.log('dowload image for clientId', clientId);
    const s3Client = new S3Client({
        region: "us-east-1",
        credentials: {
            accessKeyId: 'AKIAVLXMP2ZYUBQCOTLX',
            secretAccessKey: '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'
        }
    });

    const bucketParams = {
        Bucket: 'app-marketing-bucket',
        Key: `${clientId}.jpeg`,
    };

    try {
        const data = await s3Client.send(new GetObjectCommand(bucketParams));
        const inputStream = data.Body;
        const downloadPath =  `${clientId}.jpeg`;
        const outputStream = fs.createWriteStream(downloadPath);
        inputStream.pipe(outputStream);
        outputStream.on('finish', () => {
            console.log(`downloaded the file successfully`);
        });
    } catch (err) {
        console.log('Error', err);
    }
}

client.on('ready', () => {
     console.log('Client is ready!');

     interval =  setInterval(() => {
        console.log('Ejecution start');

        messagesRepository.getMessage().then(async (msg) => {
            console.log(msg);
            const hash = short.generate();


            if (!msg.id) return;
            const number = msg.number;
            const text = `${msg.message}  ${hash}`;

            const chatId = number.substring(1) + "@c.us";

            console.log('send media for clientId', clientId);
            const media = MessageMedia.fromFilePath(`${__dirname}/${clientId}.jpeg`);

            await client.sendMessage(chatId, media, {caption: text}).then(r => {
                let newMessage = {
                    ...msg,
                    status: "DELIVERED"
                }
                messagesRepository.updateMessage(newMessage).then(r => {
                });
            }).catch((err) => {
                console.log(err)
            });
        });
    }, 2000);
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

app.get('/init', async (req, res) => {
    clientId = req.query.clientId;
    console.log('init clientId', clientId);
    await downloadFile(clientId);
    client.initialize().then(() => {});
    res.send('start');
})


app.get('/stop', async (req, res) => {
    try {
        clientId = null;
        if (client) {
            const state =  await client.getState();
            console.log('state', state);
            if (state == "CONNECTED") {
                client.destroy();
            }
            fs.unlinkSync(path.join(__dirname+'/qr.svg'));
        }
    } catch (err) {
        console.log('Error stoping', err);
    } finally {
        clearInterval(interval);
        interval = 0; 
        res.send('stop')
    }
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
