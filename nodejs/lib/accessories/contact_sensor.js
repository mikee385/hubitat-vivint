const Device = require('../device.js')
const VivintDict = require("../vivint_dictionary.json")

class ContactSensor extends Device {
    constructor(id, name, type, data, config, log, vivintApi) {
        super(id, name, type, data, config, log, vivintApi)
		
	      this.contact = this.Characteristic.ContactSensorState.CONTACT_DETECTED
    }

    handleData(data) {
      super.handleData(data)
      	
      this.contact = Boolean(data.Status)
		    ? this.Characteristic.ContactSensorState.CONTACT_NOT_DETECTED
		    : this.Characteristic.ContactSensorState.CONTACT_DETECTED
    }

    dumpState() {
      let state = super.dumpState()
      
      state.contact = this.contact
      
      return state
    }

    static appliesTo(data) {
      return (
        (data.Type == VivintDict.PanelDeviceType.WirelessSensor) && 
        (
          (data.EquipmentCode == VivintDict.EquipmentCode.DW21R_RECESSED_DOOR) || 
          (data.EquipmentCode == VivintDict.EquipmentCode.DW10_THIN_DOOR_WINDOW) || 
          (data.EquipmentCode == VivintDict.EquipmentCode.DW11_THIN_DOOR_WINDOW) || 
          (data.EquipmentCode == VivintDict.EquipmentCode.DW20_RECESSED_DOOR) || 
          (data.EquipmentCode == VivintDict.EquipmentCode.EXISTING_DOOR_WINDOW_CONTACT) ||
          (data.EquipmentCode == VivintDict.EquipmentCode.TAKE_TAKEOVER) || 
          (data.EquipmentCode == VivintDict.EquipmentCode.GB1_GLASS_BREAK) || 
          (data.EquipmentCode == VivintDict.EquipmentCode.GB2_GLASS_BREAK) || 
          (data.EquipmentCode == VivintDict.EquipmentCode.EXISTING_GLASS_BREAK) || 
          (data.EquipmentCode == VivintDict.EquipmentCode.HW_GLASS_BREAK_5853) || 
          (data.EquipmentCode == VivintDict.EquipmentCode.TILT_SENSOR_2GIG_345) || 
          (data.EquipmentCode == VivintDict.EquipmentCode.EXISTING_HEAT) || 
          (data.EquipmentCode == VivintDict.EquipmentCode.EXISTING_FLOOD_TEMP)
        ) 
      )
    }
}

module.exports = ContactSensor
