/**
 *  Vivint Camera Driver
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
 
String getVersionNum() { return "0.0.1" }
String getVersionLabel() { return "Vivint Camera, version ${getVersionNum()} on ${getPlatform()}" }

String getType() { return "Camera" }
String[] getMotionValues() { return ["inactive", "active"] }

metadata {
    definition (
		name: "Vivint Camera", 
		namespace: "mikee385", 
		author: "Michael Pierce", 
		importUrl: "https://raw.githubusercontent.com/mikee385/hubitat-vivint/master/hubitat/vivint-camera.groovy"
	) {
	    capability "Actuator"
	    capability "MotionSensor"
        capability "Sensor"
    }
    preferences {
        section("Preferences") {
            input "logEnable", "bool", required: false, title: "Show Debug Logs?", defaultValue: true
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
    sendEvent(name: "numberOfButtons", value: 1)
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
    
    if (deviceData.motion != null) {
        if (deviceData.motion in motionValues) {
            sendEvent(name: "motion", value: deviceData.motion)
        } else {
            log.error "Unknown value for motion: ${deviceData.motion}"
        }
    } else {
        log.warn "motion not found in update."
    }
}
