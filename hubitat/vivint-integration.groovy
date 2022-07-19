/**
 *  Vivint Integration
 *
 *  Copyright 2022 Michael Pierce
 *
 *  Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except
 *  in compliance with the License. You may obtain a copy of the License at:
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software distributed under the License is distributed
 *  on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License
 *  for the specific language governing permissions and limitations under the License.
 *
 */
 
String getVersionNum() { return "0.0.18" }
String getVersionLabel() { return "Vivint Integration, version ${getVersionNum()} on ${getPlatform()}" }

java.util.LinkedHashMap getTypeMap() { return [
    "Camera": "Vivint Camera",
    "CarbonMonoxideSensor": "Vivint Carbon Monoxide Sensor",
    "ContactSensor": "Vivint Contact Sensor",
    "DoorbellCamera": "Vivint Doorbell Camera",
    "GarageDoor": "Vivint Garage Door",
    "GlassBreakSensor": "Vivint Glass Break Sensor",
    "Lock": "Vivint Lock",
    "MotionSensor": "Vivint Motion Sensor",
    "Panel": "Vivint Panel",
    "SmokeSensor": "Vivint Smoke Sensor"
] }

definition(
    name: "Vivint Integration",
    namespace: "mikee385",
    author: "Michael Pierce",
    description: "Integrates with Vivint Security System devices.",
    category: "My Apps",
    iconUrl: "",
    iconX2Url: "",
    importUrl: "https://raw.githubusercontent.com/mikee385/hubitat-vivint/master/hubitat/vivint-integration.groovy")

preferences {
    page(name: "settings", title: "Vivint Integration", install: true, uninstall: true) {
        section {
            input "url", "text", title: "Server URL", multiple: false, required: true
        }
        section {
            input "alarmPanel", "device.VivintPanel", title: "Sync Panel to HSM", multiple: false, required: false
        }
        section {
            input name: "alertOffline", type: "bool", title: "Alert when offline?", defaultValue: false
            input "offlineDuration", "number", title: "Minimum time before offline (in minutes)", required: true, defaultValue: 90
        }
        section {
            input "notifier", "capability.notification", title: "Notification Device", multiple: false, required: true
            input name: "logEnable", type: "bool", title: "Enable debug logging?", defaultValue: false
            label title: "Assign a name", required: true
        }
    }
}

mappings {
    path("/update") {
        action: [
            POST: "handleUpdate"
        ]
    },
    path("/heartbeat") {
        action: [
            GET: "heartbeat"
        ]
    }
}

def installed() {
    initialize()
}

def uninstalled() {
    disconnectFromServer()
    
    for (device in getChildDevices()) {
        deleteChildDevice(device.deviceNetworkId)
    }
}

def updated() {
    unsubscribe()
    unschedule()
    initialize()
}

def initialize() {
    // Create endpoint
    if(!state.accessToken) {
        createAccessToken()
    }
    state.updateUrl = "${getFullLocalApiServerUrl()}/update?access_token=$state.accessToken"
    state.heartbeatUrl = "${getFullLocalApiServerUrl()}/heartbeat?access_token=$state.accessToken"
    
    // Connect to server
    connectToServer()
    heartbeat()
    
    // Sync to HSM
    if (alarmPanel) {
        subscribe(alarmPanel, "alarm", handler_PanelToHSM)
        subscribe(location, "hsmStatus", handler_HSMToPanel)
    }
}

def logDebug(msg) {
    if (logEnable) {
        log.debug msg
    }
}

def connectToServer() {
    def devicesUrl = "${url}/devices"
    logDebug("Retrieving ${devicesUrl}")
    try {
        httpGet(devicesUrl) { response ->
            if(response.status == 200) {
                createDevices(response.data)
                registerListener()
            } else {
                log.error("${response.status}: ${response.data}")
            }
        }
    } catch (ex) {
        if(ex instanceof groovyx.net.http.HttpResponseException) {
            if(ex.response) {
                log.error("httpGet Response Exception | Status: ${ex.response.status} | Data: ${ex.response.data}")
            }
        } else {
            log.error "httpGet Exception: ${ex.message}"
        }
    }
    return null
}

def registerListener() {
    def listenerUrl = "${url}/listeners"
    def listenerBody = [ updateUrl: state.updateUrl, heartbeatUrl: state.heartbeatUrl ]
    logDebug("Posting to ${listenerUrl} with ${listenerBody}")
    try {
        httpPostJson(listenerUrl, listenerBody) { response ->
            if(response.status == 200) {
                log.info "Registered listener with server"
                state.listenerId = response.data.id
            } else {
                log.error "${response.status}: ${response.data}"
            }
        }
    } catch (ex) {
        if(ex instanceof groovyx.net.http.HttpResponseException) {
            if(ex.response) {
                log.error "httpPost Response Exception | Status: ${ex.response.status} | Data: ${ex.response.data}"
            }
        } else {
            log.error "httpPost Exception: ${ex.message}"
        }
    }
    return null
}

def createDevices(responseData) {
    if (responseData != null) {
        def numDevices = 0
        for(deviceData in responseData) {
            logDebug(deviceData)
                    
            def childDevice = addDevice(deviceData)
            if (childDevice != null) {
                numDevices += 1
                childDevice.update(deviceData)
            }
        }
        log.info "Created ${numDevices} devices"
    } else {
        log.error "Unable to create devices from null data."
    }
}

def getDeviceID(deviceData) {
    return "Vivint:${app.getId()}:${deviceData.id}"
}

def findDevice(deviceID) {
    for (device in getChildDevices()) {
        if (device.deviceNetworkId == deviceID) {
            return device
        }
    }
    return null
}

def addDevice(deviceData) {
    def deviceID = getDeviceID(deviceData)
    def childDevice = findDevice(deviceID)
    if (childDevice != null) {
        return childDevice
    } else {
        def deviceName = "Vivint ${deviceData.name}"
        def deviceType = typeMap[deviceData.type]
        if (deviceType != null) {
            logDebug("Creating ${deviceType} named ${deviceName}")
            return addChildDevice("mikee385", deviceType, deviceID, [label: deviceName, isComponent: false])
        } else {
            log.warn "Unknown device type ${deviceData.type} for ${deviceName}. Skipping..."
        }
    }
    return null
}

def handleUpdate() {
    if (request.JSON != null) {
        updateDevices(request.JSON)
    } else {
        state.healthStatus = "unhealthy"
        log.error "Received update that was not JSON: $request"
    }
}

def updateDevices(responseData) {
    if (responseData != null) {
        heartbeat()
        for(deviceData in responseData) {
            logDebug(deviceData)

            def childDeviceID = getDeviceID(deviceData)
            def childDevice = findDevice(childDeviceID)
            if (childDevice != null) {
                childDevice.update(deviceData)
            } else {
                logDebug("No device found for ${deviceData.name} (ID: ${deviceData.id}, Type: ${deviceData.type}). Skipping...")
            }
        }
    } else {
        state.healthStatus = "unhealthy"
        log.error "Unable to update devices from null data."
    }
}

def sendCommand(deviceID, attribute, command) {
    def commandUrl = "${url}/devices/${deviceID}"
    def commandBody = [ "${attribute}": "${command}" ]
    logDebug("Posting to ${commandUrl} with ${commandBody}")
    try {
        httpPostJson(commandUrl, commandBody) { response ->
            if(response.status == 200) {
                log.info "Command sent to server"
            } else {
                log.error "${response.status}: ${response.data}"
            }
        }
    } catch (ex) {
        if(ex instanceof groovyx.net.http.HttpResponseException) {
            if(ex.response) {
                log.error "httpPost Response Exception | Status: ${ex.response.status} | Data: ${ex.response.data}"
            }
        } else {
            log.error "httpPost Exception: ${ex.message}"
        }
    }
    return null
}

def disconnectFromServer() {
    def listenerUrl = "${url}/listeners/${state.listenerId}"
    logDebug("Deleting ${listenerUrl}")
    try {
        def params = [
            uri: listenerUrl
        ]
        httpDelete(params) { response ->
            if(response.status == 200) {
                log.info "Removed listener from server"
            } else {
                log.error "${response.status}: ${response.data}"
            }
        }
    } catch (ex) {
        if(ex instanceof groovyx.net.http.HttpResponseException) {
            if(ex.response) {
                log.error "httpDelete Response Exception | Status: ${ex.response.status} | Data: ${ex.response.data}"
            }
        } else {
            log.error "httpDelete Exception: ${ex.message}"
        }
    }
    return null
}

def heartbeat() {
    unschedule("healthCheck")
    state.healthStatus = "online"
    runIn(60*offlineDuration, healthCheck)
}

def healthCheck() {
    state.healthStatus = "offline"
    if (alertOffline) {
        notifier.deviceNotification("${app.getLabel()} is offline!")
    }
}

def handler_PanelToHSM(evt) {
    logDebug("handler_PanelToHSM: ${evt.device} changed to ${evt.value}")
    
    if (evt.value == "disarmed") {
        if (location.hsmStatus != "disarmed" && location.hsmStatus != "allDisarmed") {
            sendLocationEvent(name: "hsmSetArm", value: "disarm")
        }
    } else if (evt.value == "armed home") {
        if (location.hsmStatus != "armingNight" && location.hsmStatus != "armedNight" && location.hsmStatus != "armingHome" && location.hsmStatus != "armedHome") {
            sendLocationEvent(name: "hsmSetArm", value: "armNight")
        }
        sendLocationEvent(name: "hsmSetArm", value: "armNight")
    } else if (evt.value == "armed away") {
        if (location.hsmStatus != "armingAway" && location.hsmStatus != "armedAway") {
            sendLocationEvent(name: "hsmSetArm", value: "armAway")
        }
    }
}

def handler_HSMToPanel(evt) {
    logDebug("handler_HSMToPanel: HSM changed to ${evt.value}")
    
    if (evt.value == "disarmed" || evt.value == "allDisarmed") {
        if (alarmPanel.currentValue("alarm") != "disarmed") {
            alarmPanel.disarm()
        }
    } else if (evt.value == "armingNight" || evt.value == "armedNight" || evt.value == "armingHome" || evt.value == "armedHome") {
        if (alarmPanel.currentValue("alarm") != "armed home") {
            alarmPanel.armHome()
        }
    } else if (evt.value == "armingAway" || evt.value == "armedAway") {
        if (alarmPanel.currentValue("alarm") != "armed away") {
            alarmPanel.armAway()
        }
    } 
}