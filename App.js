/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 * @flow strict-local
 */

import React from 'react';
import type {Node} from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from 'react-native';

import {
  Colors,
  DebugInstructions,
  Header,
  LearnMoreLinks,
  ReloadInstructions,
} from 'react-native/Libraries/NewAppScreen';

import './shim';

var Web3 = require('web3');

const Section = ({children, title}): Node => {
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <View style={styles.sectionContainer}>
      <Text
        style={[
          styles.sectionTitle,
          {
            color: isDarkMode ? Colors.white : Colors.black,
          },
        ]}>
        {title}
      </Text>
      <Text
        style={[
          styles.sectionDescription,
          {
            color: isDarkMode ? Colors.light : Colors.dark,
          },
        ]}>
        {children}
      </Text>
    </View>
  );
};

const App: () => Node = () => {
  const isDarkMode = useColorScheme() === 'dark';

  const backgroundStyle = {
    backgroundColor: isDarkMode ? Colors.darker : Colors.lighter,
  };

  try {
    var web3 = new Web3('http://192.168.100.4:8545');
    // console.log(web3);
    web3.eth.net.isListening()
      .then(() => console.log('is connected'))
      .catch(e => console.log('Wow. Something went wrong: '+ e));

    web3.eth.personal.getAccounts()
      .then(accounts => {
        accounts.forEach(account => {
          web3.eth.getBalance(account)
            .then(balance => {
              balance = web3.utils.fromWei(balance, 'ether');
              console.log(`${account}: ${balance}`);
            });
        });

        web3.eth.personal.unlockAccount(accounts[0], '', 0)
          .then(() => {
            web3.eth.sendTransaction({
              from: accounts[0],
              to: accounts[1],
              value: web3.utils.toWei('15', 'ether')
            })
              .on('transactionHash', function(hash){
                console.log(`Hash: ${hash}`);
              })
              .on('receipt', function(receipt){
                console.log('Receipt: ', receipt);
              })
              .on('confirmation', function(confirmationNumber, receipt){ 
                console.log(`Confirmation: ${confirmationNumber}`);
                console.log('Receipt: ', receipt);
              })
              .on('error', console.error); // If a out of gas error, the second parameter is the receipt.
          });

        accounts.forEach(account => {
          web3.eth.getBalance(account)
            .then(balance => {
              balance = web3.utils.fromWei(balance, 'ether');
              console.log(`${account}: ${balance}`);
            });
        });
      });
  } catch(error) {
    console.log(error);
  }

  return (
    <SafeAreaView style={backgroundStyle}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        style={backgroundStyle}>
        <Header />
        <View
          style={{
            backgroundColor: isDarkMode ? Colors.black : Colors.white,
          }}>
          <Section title="Step One">
            Edit <Text style={styles.highlight}>App.js</Text> to change this
            screen and then come back to see your edits.
          </Section>
          <Section title="See Your Changes">
            <ReloadInstructions />
          </Section>
          <Section title="Debug">
            <DebugInstructions />
          </Section>
          <Section title="Learn More">
            Read the docs to discover what to do next:
          </Section>
          <LearnMoreLinks />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  sectionContainer: {
    marginTop: 32,
    paddingHorizontal: 24,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '600',
  },
  sectionDescription: {
    marginTop: 8,
    fontSize: 18,
    fontWeight: '400',
  },
  highlight: {
    fontWeight: '700',
  },
});

export default App;
