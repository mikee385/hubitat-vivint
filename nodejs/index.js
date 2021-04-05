var config = require('config')
var fs = require('fs')
var log = require("./util/logger.js")

var express = require('express')
var app = express()
var port = 38283

var bodyParser = require('body-parser')
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))

var morgan = require('morgan')
app.use(morgan('dev', {'stream': log.stream}))
      
var VivintApiModule = require("./lib/vivint_api.js")
const DeviceSetModule = require("./lib/device_set.js")

var VivintApiPromise
var PubNubPromise
var ListenersPromise
var DeviceSetPromise

app.listen(port, () => {
    log.info('Initializing...')

    let config_apiLoginRefreshSecs = config.apiLoginRefreshSecs || 1200 // once per 20 minutes default

    let VivintApi = VivintApiModule(config, log)
    VivintApiPromise = VivintApi.login({username: config.username, password: config.password})

    PubNubPromise = VivintApiPromise
        .then((vivintApi) => vivintApi.connectPubNub())
        
    ListenersPromise = fs.promises.readFile("listeners.json")
        .then((data) => {return JSON.parse(data)})
        .catch((error) => {return {nextId: 1, data: []}})

    DeviceSetPromise = Promise.all([VivintApiPromise, PubNubPromise, ListenersPromise])
        .then(([vivintApi, pubNub, listeners]) => {
            let DeviceSet = DeviceSetModule(config, log, vivintApi, listeners)
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
            
            return deviceSet
        }).catch((error) => {
            log.error("Error while initializing accessories: ", error)
        })
})

app.get('/', (req, res) => {
    res.end()
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

app.get('/devices', (req, res, next) => {
    DeviceSetPromise.then((deviceSet) => {
        let deviceData = []
        deviceSet.devices.forEach(device => {
            deviceData.push(device.dumpState())
        });
        res.send(deviceData)
    }).catch((error) => {
        var err = new Error('Error while loading devices', error)
        err.status = 500
        next(err)
    })
})

app.get('/devices/:id', (req, res, next) => {
    DeviceSetPromise.then((deviceSet) => {
        let deviceData = deviceSet.devicesById[req.params.id]
        if (deviceData) {
            res.send(deviceData.dumpState())
        } else {
            var err = new Error('Device not found')
            err.status = 404
            next(err)
        }
    }).catch((error) => {
        var err = new Error('Error while loading device', error)
        err.status = 500
        next(err)
    })
})

app.post('/devices/:id', (req, res, next) => {
    DeviceSetPromise.then((deviceSet) => {
        let device = deviceSet.devicesById[req.params.id]
        if (device) {
            device.handleCommand(req.body)
            res.end()
        } else {
            var err = new Error('Device not found')
            err.status = 404
            next(err)
        }
    }).catch((error) => {
        var err = new Error('Error while sending command to device', error)
        err.status = 500
        next(err)
    })
})

app.get('/listeners', (req, res, next) => {
    ListenersPromise.then((listeners) => {
        res.send(listeners.data)
    }).catch((error) => {
        var err = new Error('Error while loading listeners', error)
        err.status = 500
        next(err)
    })
})

app.get('/listeners/:id', (req, res, next) => {
    ListenersPromise.then((listeners) => {
        var listener = listeners.data.find((element) => element.id == req.params.id)
        if (!Object.is(listener, undefined)) {
            res.send(listener)
        } else {
            var err = new Error(`Listener not found: ${req.params.id}`)
            err.status = 404
            next(err)   
        }
    }).catch((error) => {
        var err = new Error('Error while loading listener', error)
        err.status = 500
        next(err)
    })
})

app.post('/listeners', (req, res, next) => {
    ListenersPromise.then((listeners) => {
        var listener = listeners.data.find((element) => element.url == req.body.url)
        if (Object.is(listener, undefined)) {
            log.info(`Registering new listener ${listeners.nextId}: ${req.body.url}`)
            listener = {id: listeners.nextId, url: req.body.url}
            listeners.data.push(listener)
            listeners.nextId += 1
            fs.promises.writeFile("listeners.json", JSON.stringify(listeners))
        } else {
            log.info(`Listener already registered ${listener.id}: ${req.body.url}`)
        }
        res.send(listener)
    }).catch((error) => {
        var err = new Error('Error while adding listener', error)
        err.status = 500
        next(err)
    })
})

app.delete('/listeners/:id', (req, res, next) => {
    ListenersPromise.then((listeners) => {
        var index = listeners.data.findIndex((element) => element.id == req.params.id)
        if (index > -1) {
            log.info(`Removing listener ${req.params.id}`)
            listeners.data.splice(index, 1)
            fs.promises.writeFile("listeners.json", JSON.stringify(listeners))
            res.end()
        } else {
            var err = new Error(`Listener not found: ${req.params.id}`)
            err.status = 404
            next(err)
        }
    }).catch((error) => {
        var err = new Error('Error while removing listener', error)
        err.status = 500
        next(err)
    })
})

app.use(function (req, res, next) {
    var err = new Error('Endpoint not found')
    err.status = 404
    next(err)
})

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
