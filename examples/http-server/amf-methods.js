/**
 * Available AMF gateway methods

 * These will get called from the AMF server.
 * - arguments passed in will already be native JavaScript types
 * - arguments returned should be native, and server will serialize response
 */


 
 
/**
 * Most basic method simply returns the string "Hello World"
 */ 
exports.test = function( callback ){
    return 'Hello World';
}


/**
 * Send back whatever was sent to us
 */
exports.echo = function( callback, more ){
    return [].slice.call( arguments, 1 );
}


/**
 * simulate an asynchronous function that cannot return
 */
exports.testAsync = function( callback ){
	setTimeout( function(){ callback('Hello Again') }, 100 );
}


/**
 * simulate an error whereby the function never returns and fails to callback
 */
exports.testDead = function( callback ){
	// do nothing - gateway will timeout
}

