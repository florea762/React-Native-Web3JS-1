import React, {useState} from 'react';
import {
  TouchableOpacity,
  Button,
  PermissionsAndroid,
  View,
  Text,
} from 'react-native';

import {Web3} from 'web3'; 

import base64 from 'react-native-base64';

import {BleManager, Device} from 'react-native-ble-plx';
import {styles} from './Styles/styles';
import {LogBox} from 'react-native';

LogBox.ignoreLogs(['new NativeEventEmitter']); // Ignore log notification by message
LogBox.ignoreAllLogs(); //Ignore all log notifications

const BLTManager = new BleManager();

const SERVICE_UUID = '4fafc201-1fb5-459e-8fcc-c5c9c331914b';

const MESSAGE_UUID = '6d68efe5-04b6-4a85-abc4-c2670b7bf7fd';
const BOX_UUID = 'f27b53ad-c63d-49a0-8c0f-9f297e6cc520';

function StringToBool(input: String) {
  if (input == '1') {
    return true;
  } else {
    return false;
  }
}

function BoolToString(input: boolean) {
  if (input == true) {
    return '1';
  } else {
    return '0';
  }
}

export default function App() {
  //Is a device connected?
  const [isConnected, setIsConnected] = useState(false);

  //What device is connected?
  const [connectedDevice, setConnectedDevice] = useState<Device>();

  const [message, setMessage] = useState('Nothing Yet');

  // Scans availbale BLT Devices and then call connectDevice
  async function scanDevices() {
    PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      {
        title: 'Permission Localisation Bluetooth',
        message: 'Requirement for Bluetooth',
        buttonNeutral: 'Later',
        buttonNegative: 'Cancel',
        buttonPositive: 'OK',
      },
    ).then(answere => {
      console.log('scanning');
      // display the Activityindicator

      BLTManager.startDeviceScan(null, null, (error, scannedDevice) => {
        if (error) {
          console.warn(error);
        }

        if (scannedDevice && scannedDevice.name == 'BLEExample') {
          BLTManager.stopDeviceScan();
          connectDevice(scannedDevice);
        }
      });

      // stop scanning devices after 5 seconds
      setTimeout(() => {
        BLTManager.stopDeviceScan();
      }, 5000);
    });
  }

  // handle the device disconnection (poorly)
  async function disconnectDevice() {
    console.log('Disconnecting start');

    if (connectedDevice != null) {
      const isDeviceConnected = await connectedDevice.isConnected();
      if (isDeviceConnected) {
        BLTManager.cancelTransaction('messagetransaction');
        BLTManager.cancelTransaction('nightmodetransaction');

        BLTManager.cancelDeviceConnection(connectedDevice.id).then(() =>
          console.log('DC completed'),
        );
      }

      const connectionStatus = await connectedDevice.isConnected();
      if (!connectionStatus) {
        setIsConnected(false);
      }
    }
  }

  //Function to send data to ESP32
  async function sendBoxValue(value: boolean) {
    BLTManager.writeCharacteristicWithResponseForDevice(
      connectedDevice?.id,
      SERVICE_UUID,
      BOX_UUID,
      base64.encode(value.toString()),
    ).then(characteristic => {
      console.log('Boxvalue changed to :', base64.decode(characteristic.value));
    });
  }

  //Connect the device and start monitoring characteristics
  async function connectDevice(device: Device) {
    console.log('connecting to Device:', device.name);

    device
      .connect()
      .then(device => {
        setConnectedDevice(device);
        setIsConnected(true);
        return device.discoverAllServicesAndCharacteristics();
      })
      .then(device => {
        //  Set what to do when DC is detected
        BLTManager.onDeviceDisconnected(device.id, (error, device) => {
          console.log('Device DC');
          setIsConnected(false);
        });

        //Read inital values

        //Message
        device
          .readCharacteristicForService(SERVICE_UUID, MESSAGE_UUID)
          .then(valenc => {
            setMessage(base64.decode(valenc?.value));
          });

        //monitor values and tell what to do when receiving an update

        //Message
        device.monitorCharacteristicForService(
          SERVICE_UUID,
          MESSAGE_UUID,
          (error, characteristic) => {
            if (characteristic?.value != null) {
              let message = base64.decode(characteristic?.value);
              const parameters = message.split("|");
              let hr = parameters[0];
              let ox = parameters[1];

              setMessage('Puls=' + hr + '\n Oxi=' + ox);
              console.log(
                'Message update received: ',
                'Puls= ' + base64.decode(characteristic?.value),
              );
            }
          },
          'messagetransaction',
        );

        console.log('Connection established');
      });
  }

  return (
    <View>
      <View style={{paddingBottom: 200}}></View>

      {/* Title */}
      <View style={styles.rowView}>
        <Text style={styles.titleText}>BLE Example</Text>
      </View>

      <View style={{paddingBottom: 20}}></View>

      {/* Connect Button */}
      <View style={styles.rowView}>
        <TouchableOpacity style={{width: 120}}>
          {!isConnected ? (
            <Button
              title="Connect"
              onPress={() => {
                scanDevices();
              }}
              disabled={false}
            />
          ) : (
            <Button
              title="Disonnect"
              onPress={() => {
                disconnectDevice();
              }}
              disabled={false}
            />
          )}
        </TouchableOpacity>
      </View>

      <View style={{paddingBottom: 20}}></View>

      {/* Monitored Value */}

      <View style={styles.rowView}>
        <Text style={styles.baseText}>{message}</Text>
      </View>

      <View style={{paddingBottom: 20}}></View>


    </View>
  );
}





 // try {
 //   var web3 = new Web3('http://192.168.100.31:8545');
    /// console.log(web3);
 //   web3.eth.net.isListening()
  //    .then(() => console.log('is connected'))
  //    .catch(e => console.log('Wow. Something went wrong: '+ e));

 //   web3.eth.personal.getAccounts()
  //    .then(accounts => {
  //      accounts.forEach(account => {
    //      web3.eth.getBalance(account)
   //         .then(balance => {
    //          balance = web3.utils.fromWei(balance, 'ether');
    //          console.log(`${account}: ${balance}`);
    //        });
    //    });

        /// web3.eth.personal.unlockAccount(accounts[0], '', 0)
        ///   .then(() => {
        ///    web3.eth.sendTransaction({
        ///       from: accounts[0],
        ///       to: accounts[1],
        ///       value: web3.utils.toWei('15', 'ether')
        ///     })
        ///       .on('transactionHash', function(hash){
        ///         console.log(`Hash: ${hash}`);
        ///      })
        ///       .on('receipt', function(receipt){
        ///         console.log('Receipt: ', receipt);
        ///       })
        ///       .on('confirmation', function(confirmationNumber, receipt){ 
        ///         console.log(`Confirmation: ${confirmationNumber}`);
        ///         console.log('Receipt: ', receipt);
        ///       })
        ///       .on('error', console.error); // If a out of gas error, the second parameter is the receipt.
        ///   });

        /// accounts.forEach(account => {
        ///   web3.eth.getBalance(account)
        ///     .then(balance => {
        ///       balance = web3.utils.fromWei(balance, 'ether');
        ///       console.log(`${account}: ${balance}`);
        ///     });
        /// });
  //    });
  //} catch(error) {
  //  console.log(error);
 // }

  