/**
 *  Vivint Panel Driver
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
 
String getVersionNum() { return "0.0.4" }
String getVersionLabel() { return "Vivint Panel, version ${getVersionNum()} on ${getPlatform()}" }

String getType() { return "Panel" }
String[] getStatusValues() { return ["disarmed", "armed home", "armed away", "alarm"] }

metadata {
    definition (
		name: "Vivint Panel", 
		namespace: "mikee385", 
		author: "Michael Pierce", 
		importUrl: "https://raw.githubusercontent.com/mikee385/hubitat-vivint/master/hubitat/vivint-panel.groovy"
	) {
	    capability "Actuator"
        capability "Sensor"

        attribute "status", "enum", ["disarmed", "armed home", "armed away", "alarm"]
        
        command "armAway"
        command "armHome"
        command "disarm"
    }
    preferences {
        section("Preferences") {
            input "pushStatusToHSM", "bool", required: false, title: "Push status to HSM?", defaultValue: true
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

    if (deviceData.status != null) {
        if (deviceData.status in statusValues) {
            if (pushStatusToHSM) {
                if (deviceData.status == "disarmed") {
                    sendLocationEvent(name: "hsmSetArm", value: "disarm")
                } else if (deviceData.status == "armed home") {
                    sendLocationEvent(name: "hsmSetArm", value: "armNight")
                } else if (deviceData.status == "armed away") {
                    sendLocationEvent(name: "hsmSetArm", value: "armAway")
                }
            }
            sendEvent(name: "status", value: deviceData.status)
        } else {
            log.error "Unknown value for status: ${deviceData.status}"
        }
    } else {
        log.warn "status not found in update."
    }
}

def armAway() {
    parent.sendCommand(state.id, "status", "arm away")
}

def armHome() {
    parent.sendCommand(state.id, "status", "arm home")
}

def disarm() {
    parent.sendCommand(state.id, "status", "disarm")
}