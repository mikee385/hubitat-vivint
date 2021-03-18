const Characteristic = require("./characteristic.js")

class Device {
    constructor(id, uuid, name, type, data, config, log, vivintApi) {
        this.Characteristic = Characteristic

        this.config = config
        this.log = log
        this.vivintApi = vivintApi

        this.id = id
        this.uuid = uuid
        this.name = name
        this.type = type

        this.handleData(data)
    }

    handleData(data) {
      if (data.Id != this.id)
        throw "This data does not belong to this device"

      if (!Object.is(data.BatteryLevel, undefined)) {
        this.BatteryLevelValue = data.BatteryLevel
      }

      if (!Object.is(data.LowBattery, undefined)) {
        this.LowBatteryState = Boolean(data.LowBattery) 
          ? this.Characteristic.StatusLowBattery.BATTERY_LEVEL_LOW 
          : this.Characteristic.StatusLowBattery.BATTERY_LEVEL_NORMAL
      }

      if (!Object.is(data.Tamper, undefined)) {
        this.TamperedState = Boolean(this.data.Tamper) 
          ? this.Characteristic.StatusTampered.TAMPERED
          : this.Characteristic.StatusTampered.NOT_TAMPERED
      }
    }

    dumpState() {
      let state = {}
      state.id = this.id
      state.uuid = this.uuid
      state.name = this.name
      state.type = this.type
      state.BatteryLevelValue = this.BatteryLevelValue
      state.LowBatteryState = this.LowBatteryState
      state.TamperedState = this.TamperedState
      return state
    }

    static appliesTo(data) {
      throw "appliesTo is not implemented"
    }
}

module.exports = Device