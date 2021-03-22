const Device = require('../device.js')
const VivintDict = require("../vivint_dictionary.json")

class MotionSensor extends Device {
    constructor(id, name, type, data, config, log, vivintApi) {      
      super(id, name, type, data, config, log, vivintApi)
		
	    this.motion = this.Characteristic.MotionDetected.INACTIVE
    }

    handleData(data) {
      super.handleData(data)
      	
      this.motion = Boolean(data.Status)
		    ? this.Characteristic.MotionDetected.ACTIVE
		    : this.Characteristic.MotionDetected.INACTIVE
    }

    dumpState() {
      let state = super.dumpState()
      
      state.motion = this.motion
      
      return state
    }

    static appliesTo(data) {
      return (
        (data.Type ==  VivintDict.PanelDeviceType.WirelessSensor) && 
          (
            data.EquipmentCode == VivintDict.EquipmentCode.PIR1_MOTION || 
            data.EquipmentCode == VivintDict.EquipmentCode.PIR2_MOTION || 
            data.EquipmentCode == VivintDict.EquipmentCode.EXISTING_MOTION_DETECTOR
          )
        )
    }
  }

  module.exports = MotionSensor
