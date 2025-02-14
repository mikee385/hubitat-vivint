const Characteristic = require("./characteristic.js")

class Device {
    constructor(id, name, type, data, config, log, vivintApi) {    
        this.Characteristic = new Characteristic()

        this.config = config
        this.log = log
        this.vivintApi = vivintApi

        this.id = id
        this.name = name
        this.type = type

        this.handleData(data)
    }

    handleData(data) {
      if (data.Id != this.id)
        throw "This data does not belong to this device"

      if (!Object.is(data.BatteryLevel, undefined)) {
        this.battery = data.BatteryLevel
      } else if (!Object.is(data.LowBattery, undefined)) {
        this.battery = Boolean(data.LowBattery)
          ?  10 // Use 10% for low battery
          : 100 // Use 100% for not low battery
      }

      if (!Object.is(data.Tamper, undefined)) {
        this.tamper = Boolean(data.Tamper) 
          ? this.Characteristic.StatusTampered.TAMPERED
          : this.Characteristic.StatusTampered.NOT_TAMPERED
      }
    }
    
    async handleCommand(data) {
      throw "handleCommand is not implemented"
    }

    dumpState() {
      let state = {}
      
      state.id = this.id
      state.name = this.name
      state.type = this.type
      
      state.battery = this.battery
      state.tamper = this.tamper
      
      return state
    }

    static appliesTo(data) {
      throw "appliesTo is not implemented"
    }
}

module.exports = Device
