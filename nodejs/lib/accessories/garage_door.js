const Device = require('../device.js')
const VivintDict = require("../vivint_dictionary.json")

class GarageDoor extends Device {
    constructor(id, name, type, data, config, log, vivintApi) {
        super(id, name, type, data, config, log, vivintApi)
        
        this.door = this.Characteristic.CurrentDoorState.UNKNOWN
    }
    
    handleData(data) {
      super.handleData(data)
      
      if (!Object.is(data.Status, undefined)) {
        if (data.Status == VivintDict.GarageDoorStates.Closed) {
          this.door = this.Characteristic.CurrentDoorState.CLOSED
        } else if (data.Status == VivintDict.GarageDoorStates.Closing) {
          this.door = this.Characteristic.CurrentDoorState.CLOSING
        } else if (data.Status == VivintDict.GarageDoorStates.Opened) {
          this.door = this.Characteristic.CurrentDoorState.OPEN
        } else if (data.Status == VivintDict.GarageDoorStates.Opening) {
          this.door = this.Characteristic.CurrentDoorState.OPENING
        } else if (data.Status == VivintDict.GarageDoorStates.Stopped) {
          this.door = this.Characteristic.CurrentDoorState.UNKNOWN
        } else {
          this.door = this.Characteristic.CurrentDoorState.UNKNOWN
        }
      }
    }
    
    async handleCommand(data) {
      if (!Object.is(data.door, undefined)) {
        await this.setTargetState(data.door)
      } else {
        throw new Error(`Unknown command: ${data}`)
      }
    }

    async setTargetState(targetState) {
      try {
        if (targetState == this.Characteristic.TargetDoorState.CLOSED) {
          await this.vivintApi.putDevice('door', this.id, {
              s: VivintDict.GarageDoorStates.Closing,
              _id: this.id
            })
        } else if (targetState == this.Characteristic.TargetDoorState.OPEN) {
          await this.vivintApi.putDevice('door', this.id, {
            s: VivintDict.GarageDoorStates.Opening,
            _id: this.id
          })
        } else {
          throw new Error(`Unknown garage door state: ${targetState}`)
        }
      }
      catch (err) {
        this.log.error("Failure setting garage door state:", err)
      }
    }

    dumpState() {
      let state = super.dumpState()
      
      state.door = this.door
      
      return state
    }

    static appliesTo(data) {
      return data.Type == VivintDict.PanelDeviceType.GarageDoor 
    }
  }

module.exports = GarageDoor