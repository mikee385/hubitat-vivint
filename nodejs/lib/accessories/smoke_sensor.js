const Device = require('../device.js')
const VivintDict = require("../vivint_dictionary.json")

class SmokeSensor extends Device {
    constructor(id, name, type, data, config, log, vivintApi) {
        super(id, name, type, data, config, log, vivintApi)
		
	      this.smoke = this.Characteristic.SmokeDetected.SMOKE_NOT_DETECTED
    }

    handleData(data) {
      super.handleData(data)
      	
      this.contact = Boolean(data.Status)
		    ? this.Characteristic.SmokeDetected.SMOKE_DETECTED
		    : this.Characteristic.SmokeDetected.SMOKE_NOT_DETECTED
    }

    dumpState() {
      let state = super.dumpState()
      
      state.smoke = this.smoke
      
      return state
    }

    static appliesTo (data) {
      return (
        (data.Type == VivintDict.PanelDeviceType.WirelessSensor) && 
        (
          (data.EquipmentCode == VivintDict.EquipmentCode.FIREFIGHTER_AUDIO_DETECTOR) ||
          (data.EquipmentCode == VivintDict.EquipmentCode.HW_SMOKE_5808W3) || 
          (data.EquipmentCode == VivintDict.EquipmentCode.EXISTING_SMOKE) || 
          (data.EquipmentCode == VivintDict.EquipmentCode.SMKE1_SMOKE_CANADA) || 
          (data.EquipmentCode == VivintDict.EquipmentCode.SMKE1_SMOKE) || 
          (data.EquipmentCode == VivintDict.EquipmentCode.VS_SMKT_SMOKE_DETECTOR) || 
          (data.EquipmentCode == VivintDict.EquipmentCode.SMKT2_GE_SMOKE_HEAT) || 
          (data.EquipmentCode == VivintDict.EquipmentCode.SMKT3_2GIG) || 
          (data.EquipmentCode == VivintDict.EquipmentCode.SMKT6_2GIG)
        ) 
      )
    }
  }

  module.exports = SmokeSensor
