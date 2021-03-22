const Device = require('../device.js')
const VivintDict = require("../vivint_dictionary.json")

class CarbonMonoxideSensor extends Device {
    constructor(id, name, type, data, config, log, vivintApi) {
        super(id, name, type, data, config, log, vivintApi)
        
        this.carbonMonoxide = this.Characteristic.CarbonMonoxideDetected.CO_LEVELS_NORMAL
    }

    handleData(data) {
      super.handleData(data)
      	
      this.carbonMonoxide = Boolean(data.Status)
        ? this.Characteristic.CarbonMonoxideDetected.CO_LEVELS_ABNORMAL
        : this.Characteristic.CarbonMonoxideDetected.CO_LEVELS_NORMAL
    }

    dumpState() {
      let state = super.dumpState()
      
      state.carbonMonoxide = this.carbonMonoxide
      
      return state
    }

    static appliesTo(data) {
      return (
        (data.Type == VivintDict.PanelDeviceType.WirelessSensor) && 
        (
          (data.EquipmentCode == VivintDict.EquipmentCode.VS_CO3_DETECTOR) || 
          (data.EquipmentCode == VivintDict.EquipmentCode.EXISTING_CO) || 
          (data.EquipmentCode == VivintDict.EquipmentCode.CO1_CO_CANADA) || 
          (data.EquipmentCode == VivintDict.EquipmentCode.CO1_CO) || 
          (data.EquipmentCode == VivintDict.EquipmentCode.CO3_2GIG_CO) || 
          (data.EquipmentCode == VivintDict.EquipmentCode.CARBON_MONOXIDE_DETECTOR_345_MHZ) || 
          (data.EquipmentCode == VivintDict.EquipmentCode.VS_CO3_DETECTOR)
        ) 
      )
    }
  }

  module.exports = CarbonMonoxideSensor
