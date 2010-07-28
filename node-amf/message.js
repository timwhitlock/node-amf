
/** dependencies */ 
var amf = require('./amf');



/** export constructor */
exports.AMFMessage = AMFMessage;



// ----------------------------------


function AMFMessage ( value, requestURI, responseURI ){
	this.value = value;
	this.requestURI = requestURI || '';
	this.responseURI = responseURI || '';
}


/** */
AMFMessage.prototype.toString = function(){
	return '[Object AMFMessage]';
}




	
	
