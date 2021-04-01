/**
 *  Vivint Smoke Sensor Driver
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
String getVersionLabel() { return "Vivint Smoke Sensor, version ${getVersionNum()} on ${getPlatform()}" }

String getType() { return "SmokeSensor" }
String[] getTamperValues() { return ["clear", "detected"] }
String[] getSmokeValues() { return ["clear", "tested", "detected"] }

metadata {
    definition (
		name: "Vivint Smoke Sensor", 
		namespace: "mikee385", 
		author: "Michael Pierce", 
		importUrl: "https://raw.githubusercontent.com/mikee385/hubitat-vivint/master/hubitat/vivint-smoke-sensor.groovy"
	) {
	    capability "Battery"
        capability "Sensor"
	    capability "SmokeDetector"
	    capability "TamperAlert"
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

    if (deviceData.battery != null) {
        sendEvent(name: "battery", value: deviceData.battery)
    } else {
        log.warn "battery not found in update."
    }
    
    if (deviceData.tamper != null) {
        if (deviceData.tamper in tamperValues) {
            sendEvent(name: "tamper", value: deviceData.tamper)
        } else {
            log.error "Unknown value for tamper: ${deviceData.tamper}"
        }
    } else {
        log.warn "tamper not found in update."
    }
    
    if (deviceData.smoke != null) {
        if (deviceData.smoke in smokeValues) {
            sendEvent(name: "smoke", value: deviceData.smoke)
        } else {
            log.error "Unknown value for smoke: ${deviceData.smoke}"
        }
    } else {
        log.warn "smoke not found in update."
    }
}
