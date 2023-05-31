module.exports = {
    apps : [{
        name: "watsapsender",
        script: "./index.js",
        env: {
            NODE_ENV: "development",
        },
        env_production: {
            NODE_ENV: "production",
        }
    }]
}