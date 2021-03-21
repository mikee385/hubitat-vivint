/**
 *  Vivint Integration
 *
 *  Copyright 2021 Michael Pierce
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
 
String getVersionNum() { return "0.0.2" }
String getVersionLabel() { return "Vivint Integration, version ${getVersionNum()} on ${getPlatform()}" }

java.util.LinkedHashMap getTypeMap() { return [
    "DoorbellCamera": "Vivint Doorbell Camera",
    "Lock": "Vivint Lock",
    "Panel": "Vivint Panel"
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
            input name: "logEnable", type: "bool", title: "Enable debug logging?", defaultValue: false
            label title: "Assign a name", required: true
        }
    }
}

mappings {
    path("/update") {
        action: [
            POST: "updateHandler"
        ]
    }
}

def installed() {
    initialize()
}

def uninstalled() {
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
    
    // Connect to server
    initializeServerConnection()
}

def logDebug(msg) {
    if (logEnable) {
        log.debug msg
    }
}

def initializeServerConnection() {
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
    def listenerBody = [ url: state.updateUrl ]
    logDebug("Posting to ${listenerUrl} with ${listenerBody}")
    try {
        httpPostJson(listenerUrl, listenerBody) { response ->
            if(response.status == 201) {
                log.info "Registered listener with server"
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

def updateHandler() {
    if (request.JSON != null) {
        updateDevices(request.JSON)
    } else {
        log.error "Received update that was not JSON: $request"
    }
}

def updateDevices(responseData) {
    if (responseData != null) {
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
        log.error "Unable to update devices from null data."
    }
}