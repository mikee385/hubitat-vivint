const Device = require('../device.js')
const VivintDict = require('../vivint_dictionary.json')

class Camera extends Device {
	constructor(id, name, type, data, config, log, vivintApi) {
	  super(id, name, type, data, config, log, vivintApi)

	  this.rtspUrl_HD_external = data.CameraExternalURL[0].replace(
        'rtsp://',
		`rtsp://${vivintApi.panelLogin.Name}:${vivintApi.panelLogin.Password}@`
	  )
	  this.rtspUrl_SD_external = data.CameraExternalURLStandard[0].replace(
		'rtsp://',
		`rtsp://${vivintApi.panelLogin.Name}:${vivintApi.panelLogin.Password}@`
	  )
	  this.rtspUrl_HD_internal = data.CameraInternalURL[0].replace(
		'rtsp://',
		`rtsp://${vivintApi.panelLogin.Name}:${vivintApi.panelLogin.Password}@`
	  )
	  this.rtspUrl_SD_internal = data.CameraInternalURLStandard[0].replace(
		'rtsp://',
		`rtsp://${vivintApi.panelLogin.Name}:${vivintApi.panelLogin.Password}@`
	  )
		
	  this.motion = this.Characteristic.MotionDetected.INACTIVE
	}

    handleData(data) {
      super.handleData(data)
      	
      this.motion = Boolean(data.PersonInView) || Boolean(data.VisitorDetected)
		? this.Characteristic.MotionDetected.ACTIVE
		: this.Characteristic.MotionDetected.INACTIVE
    }

    dumpState() {
      let state = super.dumpState()
      
      state.rtspUrl_HD_external = this.rtspUrl_HD_external
      state.rtspUrl_SD_external = this.rtspUrl_SD_external
      state.rtspUrl_HD_internal = this.rtspUrl_HD_internal
      state.rtspUrl_SD_internal = this.rtspUrl_SD_internal
      state.motion = this.motion
      
      return state
    }

	static appliesTo(data) {
		return data.Type == VivintDict.PanelDeviceType.Camera && data.CameraDoorbellChime != 1
	}
}

module.exports = Camera
