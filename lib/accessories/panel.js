const Device = require('../device.js')
const VivintDict = require("../vivint_dictionary.json")

class Panel extends Device {
    constructor(id, uuid, name, data, config, log, vivintApi) {
        super(id, uuid, name, data, config, log, vivintApi)

      this.VIVINT_TO_HUBITAT = {
        [VivintDict.SecurityState.DISARMED]:                  this.Characteristic.SecuritySystemCurrentState.DISARMED,
        [VivintDict.SecurityState.ARMING_AWAY_IN_EXIT_DELAY]: this.Characteristic.SecuritySystemCurrentState.AWAY_ARM,
        [VivintDict.SecurityState.ARMING_STAY_IN_EXIT_DELAY]: this.Characteristic.SecuritySystemCurrentState.STAY_ARM,
        [VivintDict.SecurityState.ARMED_STAY]:                this.Characteristic.SecuritySystemCurrentState.STAY_ARM,
        [VivintDict.SecurityState.ARMED_AWAY]:                this.Characteristic.SecuritySystemCurrentState.AWAY_ARM,
        [VivintDict.SecurityState.ARMED_STAY_IN_ENTRY_DELAY]: this.Characteristic.SecuritySystemCurrentState.STAY_ARM,
        [VivintDict.SecurityState.ARMED_AWAY_IN_ENTRY_DELAY]: this.Characteristic.SecuritySystemCurrentState.AWAY_ARM,
        [VivintDict.SecurityState.ALARM]:                     this.Characteristic.SecuritySystemCurrentState.ALARM_TRIGGERED,
        [VivintDict.SecurityState.ALARM_FIRE]:                this.Characteristic.SecuritySystemCurrentState.ALARM_TRIGGERED,
        [VivintDict.SecurityState.DISABLED]:                  this.Characteristic.SecuritySystemCurrentState.DISARMED,
        [VivintDict.SecurityState.WALK_TEST]:                 this.Characteristic.SecuritySystemCurrentState.DISARMED
      };

      this.HUBITAT_TO_VIVINT = {
        [this.Characteristic.SecuritySystemTargetState.DISARM]: VivintDict.SecurityState.DISARMED,
        [this.Characteristic.SecuritySystemTargetState.STAY_ARM]: VivintDict.SecurityState.ARMED_STAY,
        [this.Characteristic.SecuritySystemTargetState.AWAY_ARM]: VivintDict.SecurityState.ARMED_AWAY
      };

      this.VALID_CURRENT_STATE_VALUES = [
        this.Characteristic.SecuritySystemCurrentState.STAY_ARM,
        this.Characteristic.SecuritySystemCurrentState.AWAY_ARM,
        this.Characteristic.SecuritySystemCurrentState.DISARMED,
        this.Characteristic.SecuritySystemCurrentState.ALARM_TRIGGERED
      ];

      this.VALID_TARGET_STATE_VALUES = [
        this.Characteristic.SecuritySystemTargetState.STAY_ARM,
        this.Characteristic.SecuritySystemTargetState.AWAY_ARM,
        this.Characteristic.SecuritySystemTargetState.DISARM
      ];

      this.status = this.Characteristic.SecuritySystemCurrentState.DISARMED
    }

    handleData(data) {
      super.handleData(data)      
      
      if (!Object.is(data.Status, undefined)) {
        this.status = this.VIVINT_TO_HUBITAT[data.Status]
      }
    }

    async setTargetState(targetState) {
      let vivintState = this.HUBITAT_TO_VIVINT[targetState]   
      
      try {
        //Vivint does not support changing from Stay to Away and vice versa when armed so we need to disarm first
        if (targetState !== this.Characteristic.SecuritySystemTargetState.DISARM &&
          this.status !== this.Characteristic.SecuritySystemCurrentState.DISARMED) {
            await this.vivintApi.setPanelState(this.HUBITAT_TO_VIVINT[this.Characteristic.SecuritySystemTargetState.DISARM])
        }

        await this.vivintApi.setPanelState(vivintState)
      }
      catch(err) {
        this.log.error("Failure setting panel state: ", err)
      }
    }

    dumpState() {
      let state = super.dumpState()
      
      state.status = this.status
      
      return state
    }

    static appliesTo(data) {
      return data.Type == VivintDict.PanelDeviceType.Panel
    }
  }

  module.exports = Panel
