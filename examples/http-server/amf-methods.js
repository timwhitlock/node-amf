/**
 * Available AMF gateway methods

 * These will get called from the AMF server.
 * - arguments passed in will already be native JavaScript types
 * - arguments returned should be native, and server will serialize response
 */


 
 
/**
 * Most basic method simply returns the string "Hello World"
 */ 
exports.test = function(){
	return 'Hello World';
}


/**
 * Send back whatever was sent to us
 */
exports.echo = function(){
	return arguments;
}


