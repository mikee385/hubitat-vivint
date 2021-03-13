var config = require('config')
var log = console

var express = require('express')
var app = express()
var port = 38283

var config_apiLoginRefreshSecs = config.apiLoginRefreshSecs || 1200 // once per 20 minutes default
      
var VivintApiModule = require("./lib/vivint_api.js")
var VivintApiPromise
var PubNubPromise

app.listen(port, () => {
    log.info('Initializing...')

    let vivintApi = VivintApiModule(config, log)

    VivintApiPromise = vivintApi.login({username: config.username, password: config.password})
    PubNubPromise = VivintApiPromise
        .then((vivintApi) => vivintApi.connectPubNub())

    Promise.all([VivintApiPromise, PubNubPromise])
        .then(([vivintApi, pubNub]) => {
            pubNub.addListener({
                status: function(statusEvent) {
                    switch(statusEvent.category){
                        case 'PNConnectedCategory':
                            log.debug("Connected to Pubnub")
                            break
                        case 'PNReconnectedCategory':
                            log.warn("Reconnected to Pubnub")
                            break
                        default:
                            log.warn("Could not connect to Pubnub, reconnecting...")
                            log.error(statusEvent)                      }
                },
                message: function(msg) {
                    log.debug("Parsed PubNub message:", vivintApi.parsePubNub(msg.message))
                }
            })

            //Refreshing the token
            setInterval(() => {
                vivintApi.renew()
                    .then((vivintApi) => vivintApi.renewPanelLogin())
                    .catch((err) => log.error("Error refreshing login info:", err))
            }, config_apiLoginRefreshSecs * 1000)

            //Setting up the system info refresh to keep the notification stream active
            setInterval(() => {
                vivintApi.renewSystemInfo()
                    .catch((err) => log.error("Error getting system info:", err))
            }, (config_apiLoginRefreshSecs / 20) * 1000)

            log.info(`Listening on port ${port}!`)
        }).catch((error) => {
            log.error("Error while logging into Vivint:", error)
        })
})

app.get('/', (req, res) => {
    res.send("Connected!")
})

module.exports = app
