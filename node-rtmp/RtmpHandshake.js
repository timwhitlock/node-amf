

var sys = require('sys');

var utils = require('../node-amf/utils');
var bin = require('../node-amf/bin');


// export single class
exports.RtmpHandshake = RtmpHandshake;



// utility to unpack numbers
var beParser = bin.parser( true, true );  // big endian binary parser
//var leParser = bin.parser( false, true ); // little endian binary parser



/**
 * Constructor
 * @todo what to do about client/server epoch?
 */
function RtmpHandshake( data ){
	this.acknowledged = false;
	this.serverRandom = randomString(1528);
	// take a benchmark and set a zero epoch
	// this means all timestamps are milliseconds since this moment
	this.serverBench = ( new Date ).getTime();
	this.serverEpoch = 0;
	this.serverEpochStr = '\0\0\0\0';
}


/**
 * @return Number
 */
RtmpHandshake.prototype.timestamp = function( t ){
	if( t == null ){
		t = (new Date).getTime();
	}
	var delta = t - this.serverBench;
	return delta;
}




/**
 * Receive C0, C1 and send S0, S1
 * @param string data received on socket
 * @return string data to write in response
 */
RtmpHandshake.prototype.initialize = function( data ){
	if( data.length !== 1537 ){
		throw new Error('Expecting 1537 octets, got ' + data.length);
	}
	// 5.2 C0 and S0
	if( 3 !== data.charCodeAt(0)){
		// @todo should we abandon the connectipon or reply with \3? spec contradicts itself
		throw new Error('Unexpected version, Only version 3 is supported');
		return '\3';
	}
	// 5.3 - C1 and S1 - 
	// recieve C1
	if( '\0\0\0\0' !== data.slice(5,9) ){
		throw new Error('Handshake error: zeroed string expected');
	}
	this.clientEpochStr = data.slice(1,5);
	this.clientEpoch = beParser.toInt( this.clientEpochStr );
	this.clientRandom = data.slice(9);
	// @todo whould we mirror the client's epoch??
	//this.serverEpochStr = this.clientEpochStr;
	//this.serverEpoch = this.clientEpoch;
	// return S0 + S1 packet to respond with
	return '\3' + this.serverEpochStr + '\0\0\0\0' + this.serverRandom;
}




/** Receive C1 and send S1 */
RtmpHandshake.prototype.acknowledge = function( data ){
	// recieve C2
	if( this.serverRandom !== data.slice( 8, 1536 ) ){
		throw new Error('Handshake error: server random echo does not match');
	}
	if( this.serverEpochStr !== data.slice(0,4) ){
		throw new Error('Handshake error: server epoch echo does not match');
	}
	this.clientBench = beParser.toInt( data.slice(4,8) ); // always seems to be zero?
	// return S2 packet to respond with
	this.acknowledged = true;
	// @todo unsure about this timestamp as it will be equal to the epoch
	var time2 = this.timestamp( this.serverBench );
	return this.clientEpochStr + beParser.fromDWord(time2) + this.clientRandom;
}





// utility
function randomString( len ){
	var s = '';
	for( var i = 0; i < len; i++ ){
		 s += String.fromCharCode( Math.round( 255 * Math.random() ) );
	}
	return s;
}











