
/** dependencies */ 
var amf = require('./amf');



exports.createMessage = function( value, requestURI, responseURI ){
	return new AMFMessage( value, requestURI, responseURI );
}


// ----------------------------------


function AMFMessage( value, requestURI, responseURI ){
	this.value = value;
	this.requestURI = requestURI || '';
	this.responseURI = responseURI || '';
}


/** */
AMFMessage.prototype.toString = function(){
	return '[Object AMFMessage]';
}




	
	
