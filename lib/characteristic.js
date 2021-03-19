class Characteristic {    
    static LockCurrentState = {
        UNSECURED: "unlocked",
        SECURED: "locked",
        JAMMED: "unknown",
        UNKNOWN: "unknown"
    }
    
    static LockTargetState = {
        UNSECURED: "unlock",
        SECURED: "lock"
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
    
    static StatusTampered  = {
        NOT_TAMPERED: "clear",
        TAMPERED: "detected"
    }
}

module.exports = Characteristic
