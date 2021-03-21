const VivintDict = require("./vivint_dictionary.json")

// const ContactSensor = require("./accessories/contact_sensor.js")
// const SmokeSensor = require("./accessories/smoke_sensor.js")
// const CarbonMonoxideSensor = require("./accessories/carbon_monoxide_sensor.js")
// const MotionSensor = require("./accessories/motion_sensor.js")
 const Lock = require("./accessories/lock.js")
// const Thermostat = require("./accessories/thermostat.js")
// const GarageDoor = require("./accessories/garage_door.js")
const Panel = require("./accessories/panel.js")
const Camera = require("./accessories/camera.js")
// const LightSwitch = require("./accessories/light_switch.js")
// const DimmerSwitch = require("./accessories/dimmer_switch.js")
const DoorbellCamera = require("./accessories/doorbell_camera.js")

function DeviceSetModule(config, log, vivintApi) {

  let config_IgnoredDeviceTypes = config.ignoreDeviceTypes || []

  class DeviceSet {
    constructor() {
      this.lastSnapshotTime = 0
      this.devices = []
      this.devicesById = {}
      this.panel_DeviceId = 0
    }

    handleSnapshot(deviceData, timestamp) {
      if (timestamp < this.lastSnapshotTime) {
        log.warn(`Ignoring stale snapshot ${timestamp} < ${this.lastSnapshotTime}`)
        return;
      }
      if (timestamp == this.lastSnapshotTime) {
        log.debug(`Ignoring unchanged snapshot ${timestamp}`)
        return;
      }

      this.lastSnapshotTime = timestamp
      log.info(`Handling device snapshot ${timestamp}`)
      log.debug("Handling device snapshot: ", deviceData)

      //Move Security Status value to the Panel device
      let panelData = deviceData.Devices.find((dvc) => dvc.Id == this.panel_DeviceId)
      if (panelData !== null) {
        panelData.Status = deviceData.Status
      }

      for (let _deviceId in this.devicesById) {             
        let deviceId = parseInt(_deviceId)
        let data = deviceData.Devices.find((dvc) => dvc.Id == deviceId)

        if (data) {
          let device = this.devicesById[_deviceId]
          device.handleData(data)
          log.info(`Device refreshed: [ID]:${device.id}, [Type]:${device.type}, [Name]:${device.name}`)
          log.debug("Device refreshed: ", device.dumpState())
        }
      }
    }

    handleMessage(message) {
      if (message.Data) {
        let timestamp = message.Data.PlatformContext.Timestamp
        if (timestamp < this.lastSnapshotTime) {
          log.warn(`Ignoring stale update ${timestamp} < ${this.lastSnapshotTime}`)
          return;
        }

        //Panel
        if (message.Id === vivintApi.panelId && message.Data.Status != undefined) {
          //Move Security Status value to the Panel device
          message.Data.Devices = [{
            Id: this.panel_DeviceId,
            Status: message.Data.Status
          }]
        }
        //Jammed lock notification
        else if (message.Type === VivintDict.ObjectType.InboxMessage && message.Data != null && message.Data.Subject != null && message.Data.Subject.indexOf('failed to lock') !== -1){
          const lockName = message.Data.Subject.split('Alert: ')[1].split(' failed to lock')[0]
          var lockDevice = this.devices.find(device => {
            return device.data.Type === VivintDict.PanelDeviceType.DoorLock && device.name === lockName
          })
          if (lockDevice) {
            message.Data.Devices = [{
              Id: lockDevice.data.Id,
              Status: Characteristic.LockCurrentState.JAMMED
            }]
          }
        }

        if (message.Data.Devices) {
          message.Data.Devices.forEach((patch) => {
            let device = this.devicesById[patch.Id]
            if (device) {
              device.handleData(patch)
              log.info(`Device patched: [ID]:${device.id}, [Type]:${device.type}, [Name]:${device.name}`)
              log.debug("Device patched: ", device.dumpState())
            }
          })
        }
      }
    }
    
    createDevice(data) {
      let deviceClass = Devices.find((dc) => {
        return dc.appliesTo(data)
      })

      //These device types are not useable for HomeKit purposes
      const irrelevantDeviceTypes = ['sensor_group','network_hosts_service','panel_diagnostics_service','iot_service','scheduler_service','yofi_device','keyfob_device']
      if (irrelevantDeviceTypes.indexOf(data.Type) != -1) {
        log.info(`Unuseable device [ID]:${data.Id} [Type]:${data.Type} [EquipmentCode]:${data.EquipmentCode} [Name]:${data.Name}`)
        log.debug(`Unuseable device [Type]:${data.Type} [Data]:`, data)
        return null
      }

      if (!deviceClass) {
        log.info(`Device not (yet) supported [ID]:${data.Id} [Type]:${data.Type} [EquipmentCode]:${data.EquipmentCode} [Name]:${data.Name}`)
        log.debug(`Unsupported device [Type]:${data.Type} [Data]:`, data)
        return null
      }

      if (config_IgnoredDeviceTypes.indexOf(data.Type) != -1) {
        log.info(`Ignored device [ID]:${data.Id} [Type]:${data.Type} [EquipmentCode]:${data.EquipmentCode} [Name]:${data.Name}`)
        log.debug(`Ignored device [Type]:${data.Type} [Data]:`, data)
        return null
      }

      log.info(`Adding device [ID]:${data.Id} [Type]:${data.Type} [EquipmentCode]:${data.EquipmentCode} [Name]:${data.Name}`)
      log.debug(`Adding device [Type]:${data.Type} [Data]:`, data)

      let serial = (data.SerialNumber32Bit || 0).toString(16).padStart(8, '0') + ':' + (data.SerialNumber || 0).toString(16).padStart(8, '0') + ':' + data.Id

      var manufacturer = "Vivint"
      var model = data.EquipmentCode !== undefined ? vivintApi.getDictionaryKeyByValue(VivintDict.EquipmentCode, data.EquipmentCode) : deviceClass.name

      //For non-Vivint devices override values 
      if (data.ActualType) {
        let splittedName = data.ActualType.split('_')
        if (splittedName.length > 0) {
          manufacturer = splittedName[0].toUpperCase()
        }
        if (splittedName.length > 1) {
          model = splittedName[1].toUpperCase()
        }
      }

      let device = new deviceClass(
        data.Id,
        data.Name,
        deviceClass.name,
        data, config, log, vivintApi)

      device.Manufacturer = manufacturer
      device.Model = model
      device.SerialNumber = serial

      if (data.CurrentSoftwareVersion || data.SoftwareVersion){
        device.FirmwareRevision = data.CurrentSoftwareVersion || data.SoftwareVersion
      }
            
      this.devices.push(device)
      this.devicesById[device.id] = device

      if (device.type === "Panel") this.panel_DeviceId = device.id
      
      log.info(`Device created: [ID]:${device.id}, [Type]:${device.type}, [Name]:${device.name}`)
      log.debug("Device created: ", device.dumpState())

      return device
    }
  }

  // let Devices = [ContactSensor, SmokeSensor, CarbonMonoxideSensor, MotionSensor, Lock, Thermostat, GarageDoor, Panel, Camera, LightSwitch, DimmerSwitch]
  let Devices = [Camera, DoorbellCamera, Lock, Panel]
  return DeviceSet
}

module.exports = DeviceSetModule
