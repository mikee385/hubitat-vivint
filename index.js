var config = require('config')
var log = require("./util/logger.js")

var express = require('express')
var app = express()
var port = 38283

var morgan = require('morgan')
app.use(morgan('dev', {'stream': log.stream}))
      
var VivintApiModule = require("./lib/vivint_api.js")
const DeviceSetModule = require("./lib/device_set.js")

var VivintApiPromise
var PubNubPromise
var deviceSet

app.listen(port, () => {
    log.info('Initializing...')

    let config_apiLoginRefreshSecs = config.apiLoginRefreshSecs || 1200 // once per 20 minutes default

    let VivintApi = VivintApiModule(config, log)
    VivintApiPromise = VivintApi.login({username: config.username, password: config.password})

    PubNubPromise = VivintApiPromise
        .then((vivintApi) => vivintApi.connectPubNub())

    Promise.all([VivintApiPromise, PubNubPromise])
        .then(([vivintApi, pubNub]) => {
            let DeviceSet = DeviceSetModule(config, log, vivintApi)
            deviceSet = new DeviceSet()

            log.debug("Initial snapshot: ", vivintApi.deviceSnapshot())

            vivintApi.deviceSnapshot().Devices
                .filter((data) => data.Id)
                .map((deviceData) => deviceSet.createDevice(deviceData))
    
            pubNub.addListener({
                status: function(statusEvent) {
                    switch(statusEvent.category){
                        case 'PNConnectedCategory':
                            log.info("Connected to PubNub")
                            break
                        case 'PNReconnectedCategory':
                            log.info("Reconnected to PubNub")
                            break
                        default:
                            log.warn("Could not connect to PubNub, reconnecting...")
                            log.error("PubNub status: ", statusEvent)
                    }
                },
                message: function(msg) {
                    let parsedMessage = vivintApi.parsePubNub(msg.message)
                    log.debug("Parsed PubNub message:", parsedMessage)
                    try {
                        deviceSet.handleMessage(parsedMessage)
                    }
                    catch (error) {
                        log.error('Error occured while handling PubNub message: ', error)
                    }
                }
            })
            deviceSet.handleSnapshot(vivintApi.deviceSnapshot(), vivintApi.deviceSnapshotTs())

            //Refreshing the token
            setInterval(() => {
                vivintApi.renew()
                    .then((vivintApi) => vivintApi.renewPanelLogin())
                    .catch((error) => {
                        log.error("Error refreshing login info: ", error)
                    })
            }, config_apiLoginRefreshSecs * 1000)

            //Setting up the system info refresh to keep the notification stream active
            setInterval(() => {
                vivintApi.renewSystemInfo()
                    .then((vivintApi) => deviceSet.handleSnapshot(vivintApi.deviceSnapshot(), vivintApi.deviceSnapshotTs()))
                    .catch((error) => {
                        log.error("Error getting system info: ", error)
                    })
            }, (config_apiLoginRefreshSecs / 20) * 1000)

            log.info(`Listening on port ${port}!`)
        }).catch((error) => {
            log.error("Error while bootstrapping accessories: ", error)
        })
})

app.get('/', (req, res) => {
    res.send("Connected!")
})

app.get('/snapshot', (req, res, next) => {
    VivintApiPromise.then((vivintApi) => {
        res.send(vivintApi.deviceSnapshot())
    }).catch((error) => {
        var err = new Error('Error while loading snapshot', error)
        err.status = 500
        next(err)
    })
})

app.get('/devices', (req, res) => {
    let deviceData = []
    deviceSet.devices.forEach(device => {
        deviceData.push(device.dumpState())
    });
    res.send(deviceData)
})

app.get('/devices/:id', (req, res, next) => {
    let deviceData = deviceSet.devicesById[req.params.id]
    if (deviceData) {
        res.send(eviceData.dumpState())
    } else {
        var err = new Error('Device not found')
        err.status = 404
        next(err)
    }
})

app.use(function (req, res, next) {
    var err = new Error('Endpoint not found')
    err.status = 404
    next(err)
});

if (app.get('env') === 'development') {
    app.use(function (err, req, res, next) {
        let status = err.status || 500
        log.error(`${status}:`, err)
        
        res.status(status)
        res.send({
            status: status,
            message: err.message,
            stack: err.stack
        })
    })
} else {
    app.use(function (err, req, res, next) {
        let status = err.status || 500
        log.error(`${status}:`, err)
        
        res.status(status)
        res.send({
            status: status,
            message: err.message
        })
    })
}

module.exports = app
