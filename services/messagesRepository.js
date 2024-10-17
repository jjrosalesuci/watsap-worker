const axiosRetry = require('axios-retry');
const axios = require('axios');

axiosRetry(axios, {retries: 4});

const getMessage = () => {
    return new Promise((resolve, reject) => {
        const config = {
            method: 'get',
            url: 'http://167.99.145.9:3002/whatsapp/pending',
            headers: {
                'token': 'JCBCDHVYDGFYEe123'
            }
        };
        axios(config)
            .then(function (response) {
                resolve(response.data);
            })
            .catch(function (error) {
                reject(error)
            });
    })
}

const updateMessage = (data) => {
    return new Promise((resolve, reject) => {
    const body = JSON.stringify(data);
    const config = {
        method: 'put',
        url: 'http://167.99.145.9:3002/whatsapp',
        headers: {
            'token': 'JCBCDHVYDGFYEe123',
            'Content-Type': 'application/json'
        },
        data : body
    };

    axios(config)
        .then(function (response) {
            resolve(response.data);
        })
        .catch(function (error) {
            reject(error)
        });
    })
}

module.exports = {
    getMessage: getMessage,
    updateMessage: updateMessage
}