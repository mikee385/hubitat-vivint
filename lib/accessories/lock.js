const Device = require('../device.js')
const VivintDict = require("../vivint_dictionary.json")

class Lock extends Device {
    constructor(id, uuid, name, data, config, log, vivintApi) {
        super(id, uuid, name, data, config, log, vivintApi)

      this.lock = this.Characteristic.LockCurrentState.UNKNOWN
    }

    handleData(data) {
      super.handleData(data)
      
      if (!Object.is(data.Status, undefined)) {
        if (data.Status == false) {
            this.lock = this.Characteristic.LockCurrentState.UNSECURED
        } else if (data.Status == true) {
            this.lock = this.Characteristic.LockCurrentState.SECURED
        } else if (data.Status == 2) {
            this.lock = this.Characteristic.LockCurrentState.JAMMED
        }  else {
            this.lock = this.Characteristic.LockCurrentState.UNKNOWN
        }
      }
    }

    async setTargetState(targetState) {
      let locked = (targetState == this.Characteristic.LockTargetState.SECURED)     
      try {
        await this.vivintApi.setLockState(this.id, locked)
      }
      catch (err) {
        this.log.error("Failure setting lock state:", err)
      }
    }

    dumpState() {
      let state = super.dumpState()
      
      state.lock = this.lock
      
      return state
    }

    static appliesTo(data) {
      return data.Type == VivintDict.PanelDeviceType.DoorLock
    }
  }

  module.exports = Lock
