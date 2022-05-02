const qrcode = require('qrcode-terminal');
const {Client, LocalAuth, NoAuth} = require('whatsapp-web.js');
const messagesRepository = require("./services/messagesRepository");

const config = {
    timeRange : '1'
};

const client = new Client({
    authStrategy: new LocalAuth()
    // authStrategy: new NoAuth()
});

client.on('qr', qr => {
    qrcode.generate(qr, {small: true});
});

client.on('ready', () => {
    console.log('Client is ready!');
    setInterval(() => {
        const today = new Date();
        const second =  `${today.getSeconds()}`;
        if (second[0] != config.timeRange) {
            return
        }
        console.log('Ejecution start: ', second);
        messagesRepository.getMessage().then((msg) => {
            console.log(msg);
            if (!msg.id) return;
            const number = msg.number;
            const text = msg.message;
            const chatId = number.substring(1) + "@c.us";
            client.sendMessage(chatId, text).then(r => {
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
    }, 2000);
});


client.initialize();