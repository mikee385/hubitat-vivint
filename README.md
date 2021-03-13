<SPAN ALIGN="CENTER">

# Hubitat Vivint

## Hubitat support for Vivint system.
</SPAN>

## Overview

This is a fork of [homebridge-vivint](https://github.com/balansse/homebridge-vivint) plugin for [homebridge](https://github.com/nfarina/homebridge), adapted to integrate with Hubitat instead of Homebridge.
It allows to use your Vivint SmartHome products in Hubitat.

Homebridge-Vivint was initially written by a former Vivint employee, Tim Harper. This project is not officially endorsed, sponsored, or affiliated with Vivint SmartHome in any way.

## Usage

There are two pieces that must be deployed separately. 

The first is the web server running on Node.js. This must be deployed on a separate computer on the same network as your Hubitat hub. It does not run on Hubitat itself.

Ensure you are running Node v10.17.0 or higher (this version is required by the original project). You can check by using `node -v`.

Then, edit the `config/default.json` file with the following configuration:


```
{
    {
      "platform": "Vivint",
      "username": "your-vivint-user@email.com",
      "password": "vivint-user-password",
      "apiLoginRefreshSecs": 1200
    }
}
```

Then, launch the web server by running the following from the command line:

```
node index.js
```

You can test the connection by accessing the following URL:

```
http://localhost:38283/devices
```

This should return a JSON array of the devices found within your Vivint account.

Once the web server is running, you must deploy the Hubitat application and drivers code to your Hubitat hub. The easiest way to do this is to use Hubitat Package Manager (HPM).

*To-Do: Add more instructions for installing to Hubitat*

## Supported Items

Currently, the following items are supported:

* Locks
* Contact sensors
* Thermostat
* Motion sensors
* Garage Door Opener
* Alarm Panel (arm home/away, disarm)
* Cameras & Doorbells
* Tilt sensors
* Fire alert sensors
* Glass break sensors
* Smoke detectors
* Carbon monoxide sensors
* Heat / Freeze sensors
* Z-Wave switches (binary and dimmer) that are paired with the Vivint panel. Be sure they are labeled "light" or "fan" if they control those respective devices.

As I do not have access to all varieties of hardware that is supported by Vivint, some incompatibilities might happen. If you notice any weird behavior or your Vivint device is not supported, please submit an issue.

## Configuration

Configuration sample:

    {
      "platform": "Vivint",
      "username": "your-vivint-user@email.com",
      "password": "vivint-user-password",
      "apiLoginRefreshSecs": 1200
    }

A general recommendation: consider creating and using a new Vivint account named "Hubitat". This way, your Vivint logs will show "the front door was unlocked by Hubitat", etc.

Configuration options overview:

* **username**
* **password**
* **apiLoginRefreshSecs** - How often should the web server renew the session token? The token that Vivint provides when authenticating will expire. Also, when this renewal occurs, the web server requests another snapshot. The event stream can sometimes fail to report device state appropriately and events can come out of order with the snapshot, or updates can be missed entirely. The occasional snapshot retrieval will auto-correct any such errors. Avoid setting this any more frequent that 10 minutes.
