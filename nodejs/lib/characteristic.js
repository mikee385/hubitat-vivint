class Characteristic {
    constructor() {
        this.CarbonMonoxideDetected = {
            CO_LEVELS_ABNORMAL: "detected",
            CO_LEVELS_NORMAL: "clear"
        }
        
        this.ContactSensorState = {
            CONTACT_NOT_DETECTED: "open",
            CONTACT_DETECTED: "closed"
        }
        
        this.CurrentDoorState = {
            CLOSED: "closed",
            CLOSING: "closing",
            OPEN: "open",
            OPENING: "opening",
            UNKNOWN: "unknown"
        }
        
        this.TargetDoorState = {
            CLOSED: "close",
            OPEN: "open"
        }
        
        this.GlassBreakState = {
            GLASS_BREAK_DETECTED: "detected",
            GLASS_BREAK_NOT_DETECTED: "clear"
        }
        
        this.LockCurrentState = {
            UNSECURED: "unlocked",
            SECURED: "locked",
            JAMMED: "unknown",
            UNKNOWN: "unknown"
        }
        
        this.LockTargetState = {
            UNSECURED: "unlock",
            SECURED: "lock"
        }
        
        this.MotionDetected = {
            INACTIVE: "inactive",
            ACTIVE: "active"
        }

        this.SecuritySystemCurrentState = {
          STAY_ARM: "armed home",
          AWAY_ARM: "armed away",
          DISARMED: "disarmed",
          ALARM_TRIGGERED: "alarm"
        }

        this.SecuritySystemTargetState = {
          STAY_ARM: "arm home",
          AWAY_ARM: "arm away",
          DISARM: "disarm"
        }
        
        this.SmokeDetected = {
            SMOKE_DETECTED: "detected",
            SMOKE_NOT_DETECTED: "clear"
        }
        
        this.StatusTampered  = {
            NOT_TAMPERED: "clear",
            TAMPERED: "detected"
        }
    }
}

module.exports = Characteristic
