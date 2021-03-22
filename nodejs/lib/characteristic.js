class Characteristic {
    static CarbonMonoxideDetected = {
        CO_LEVELS_ABNORMAL: "detected",
        CO_LEVELS_NORMAL: "clear"
    }
    
    static ContactSensorState = {
        CONTACT_NOT_DETECTED: "open",
        CONTACT_DETECTED: "closed"
    }
    
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
    
    static MotionDetected = {
        INACTIVE: "inactive",
        ACTIVE: "active"
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
