const Camera = require('./camera.js')
const VivintDict = require('../vivint_dictionary.json')

class DoorbellCamera extends Camera {
	constructor(id, name, type, data, config, log, vivintApi) {
	  super(id, name, type, data, config, log, vivintApi)
      		
	  this.pushed = false
	}

    handleData(data) {
      super.handleData(data)
      
	  this.pushed = Boolean(data.DingDong)
    }

    dumpState() {
      let state = super.dumpState()
      
      state.pushed = this.pushed
      
      return state
    }

	static appliesTo(data) {
		return data.Type == VivintDict.PanelDeviceType.Camera && data.CameraDoorbellChime == 1
	}
}

module.exports = DoorbellCamera

