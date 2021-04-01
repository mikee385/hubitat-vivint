const Device = require('../device.js')
const VivintDict = require("../vivint_dictionary.json")

class GlassBreakSensor extends Device {
    constructor(id, name, type, data, config, log, vivintApi) {
        super(id, name, type, data, config, log, vivintApi)
		
	      this.contact = this.Characteristic.GlassBreakState.GLASS_BREAK_NOT_DETECTED
    }

    handleData(data) {
      super.handleData(data)
      	
      this.glassBreak = Boolean(data.Status)
		    ? this.Characteristic.GlassBreakState.GLASS_BREAK_DETECTED
		    : this.Characteristic.GlassBreakState.GLASS_BREAK_NOT_DETECTED
    }

    dumpState() {
      let state = super.dumpState()
      
      state.glassBreak = this.glassBreak
      
      return state
    }

    static appliesTo(data) {
      return (
        (data.Type == VivintDict.PanelDeviceType.WirelessSensor) && 
        (
          (data.EquipmentCode == VivintDict.EquipmentCode.GB1_GLASS_BREAK) || 
          (data.EquipmentCode == VivintDict.EquipmentCode.GB2_GLASS_BREAK) || 
          (data.EquipmentCode == VivintDict.EquipmentCode.EXISTING_GLASS_BREAK) || 
          (data.EquipmentCode == VivintDict.EquipmentCode.HW_GLASS_BREAK_5853)
        ) 
      )
    }
}

module.exports = GlassBreakSensor
