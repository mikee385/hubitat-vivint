/**
 *  Vivint Garage Door Driver
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
 
String getVersionNum() { return "0.0.1" }
String getVersionLabel() { return "Vivint Garage Door, version ${getVersionNum()} on ${getPlatform()}" }

String getType() { return "GarageDoor" }
String[] getDoorValues() { return ["closing", "closed", "open", "opening", "unknown"] }

metadata {
    definition (
		name: "Vivint Garage Door", 
		namespace: "mikee385", 
		author: "Michael Pierce", 
		importUrl: "https://raw.githubusercontent.com/mikee385/hubitat-vivint/master/hubitat/vivint-garage-door.groovy"
	) {
	    capability "Actuator"
	    capability "GarageDoorControl"
        capability "Sensor"
    }
    preferences {
        section("Preferences") {
            input "logEnable", "bool", required: false, title: "Show Debug Logs?", defaultValue: false
        }
    }
}

def installed() {
    initialize()
}

def updated() {
    unschedule()
    initialize()
}

def initialize() {
}

def logDebug(msg) {
    if (logEnable) {
        log.debug msg
    }
}

def update(deviceData) {
    logDebug("Updating ${device.label} with data: ${deviceData}")
    
    if (deviceData.id != null) {
        if (!state.id) {
            state.id = deviceData.id
        } else if (deviceData.id != state.id) {
            log.error "This update does not belong to this device."
            return
        }
    } else {
        log.warn "id not found in update. This update may not belong to this device."
    }
    
    if (deviceData.type != null) {
        if (deviceData.type != type) {
            log.warn "Type has changed from $type to ${deviceData.type}. This device may not update correctly."
        }
    } else {
        log.warn "type not found in update. This device may not update correctly."
    }

    if (deviceData.door != null) {
        if (deviceData.door in doorValues) {
            sendEvent(name: "door", value: deviceData.door)
        } else {
            log.error "Unknown value for door: ${deviceData.door}"
        }
    } else {
        log.warn "door not found in update."
    }
}

def close() {
    parent.sendCommand(state.id, "door", "close")
}

def open() {
    parent.sendCommand(state.id, "door", "open")
}