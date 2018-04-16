/*jslint node: true */
"use strict";

/* 
 * This script listens for data on the first two (of five available) Scratch characteristics
 * Scratch One: contains a counter on the number of times the sketch was run and data put in the characteristics
 * Scratch Two: contains the current temperature
*/

var Bean = require('ble-bean');
const { Client } = require('tplink-smarthome-api');
const client = new Client();
const FIREPLACE_MAC_ADDRESS = "50:C7:BF:6C:0C:78";
var host, port, device, deviceInfo;

if(host === undefined) {
  // Look for fireplace device and log to console
  client.startDiscovery().on('device-new', (_device) => {
    if(_device.mac === FIREPLACE_MAC_ADDRESS) {
      device = _device;
      console.log("Host IP: " + _device.host, " Port: " + _device.port);
      host = _device.host;
      port = _device.port;
      _device.getSysInfo().then(function(_deviceInfo) {
        deviceInfo = _deviceInfo;
        console.log(_deviceInfo);
      });
    //client.stopDiscovery();
    };
  });
} 

var intervalId;
var connectedBean;

Bean.discover(function(bean){
  connectedBean = bean;
  process.on('SIGINT', exitHandler.bind(this));

  bean.on("serial", function(data, valid){
    console.log(data.toString());
  });

  bean.on("disconnect", function(){
    process.exit();
  });

  bean.connectAndSetup(function(){
/*
    bean.notifyOne(
      //called when theres data
      function(data){
        if(data && data.length>=2){
          var value = data[1]<<8 || (data[0]);
          console.log("one:", value);
        }
      },
      //called when the notify is successfully or unsuccessfully setup
      function(error){
        if(error) console.log("one setup: ", error);
      });
*/
    bean.notifyTwo(
      //called when theres data
      function(data){
        if(data && data.length>=2){
          var value = data[1]<<8 || (data[0]);
          console.log("two:", value);
          if(value >22) {
            device.setPowerState(false);
          } else {
            device.setPowerState(true);
          }
        }
      },
      //called when the notify is successfully or unsuccessfully setup
      function(error){
        if(error) console.log("two setup: ", error);
      });

  });

});

process.stdin.resume();//so the program will not close instantly
var triedToExit = false;

//turns off led before disconnecting
var exitHandler = function exitHandler() {

  var self = this;
  if (connectedBean && !triedToExit) {
    triedToExit = true;
    console.log('Turning off led...');
    clearInterval(intervalId);
    connectedBean.setColor(new Buffer([0x0,0x0,0x0]), function(){});
    //no way to know if succesful but often behind other commands going out, so just wait 2 seconds
    console.log('Disconnecting from Device...');
    setTimeout(connectedBean.disconnect.bind(connectedBean, function(){}), 2000);
  } else {
    process.exit();
  }
};
