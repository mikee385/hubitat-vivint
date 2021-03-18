class Characteristic {
    static StatusLowBattery = {
        BATTERY_LEVEL_NORMAL: "normal",
        BATTERY_LEVEL_LOW: "low"
    }
    static StatusTampered  = {
        NOT_TAMPERED: "not tampered",
        TAMPERED: "tampered"
    }

    static SecuritySystemCurrentState = {
      STAY_ARM: "armed home",
      AWAY_ARM: "armed away",
      DISARMED: "disarmed",
      ALARM_TRIGGERED: "alarm"
    }

    static SecuritySystemTargetState = {
      STAY_ARM: "arm home",
      AWAY_ARM: "arm away",
      DISARM: "disarm"
    }
}

module.exports = Characteristic
