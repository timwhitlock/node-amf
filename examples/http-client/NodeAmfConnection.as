/**
 * Extended NetConnection to test AMF requests
 * Set "host" variable to your nodejs http end point
 */



package {
	
	import flash.utils.setTimeout;
	import flash.net.NetConnection;
	import flash.net.ObjectEncoding;
	import flash.net.Responder;
	
	import flash.events.NetStatusEvent;
	import flash.events.IOErrorEvent;
	import flash.events.AsyncErrorEvent;
	import flash.events.SecurityErrorEvent;
	
	public class NodeAmfConnection extends NetConnection {
		
		private var host:String = 'http://192.168.51.6:8081';
		private var responder:Responder;
		
		/**
		 * Constructor 
		 */
		function NodeAmfConnection(){
			// connect to AMF gateway and be ready to call methods
			responder = new Responder( this.onResponse, this.onFault );
			connect( host );
			this.client = this;
			addEventListener( NetStatusEvent.NET_STATUS, onNetStatus );
			addEventListener( IOErrorEvent.IO_ERROR, onError );
			addEventListener( AsyncErrorEvent.ASYNC_ERROR, onError );
			addEventListener( SecurityErrorEvent.SECURITY_ERROR, onError );
			proxyType = 'HTTP';
			// call all available AMF methods defined by the gateway
			call("test", responder );
			call("echo", responder, 'a£b' );
		}
		
		
		/** NetStatusEvent handler - print out event info */
		public function onNetStatus( Evt:NetStatusEvent ):void {
			trace('[onNetStatus]');
			for( var s:String in Evt.info ){
				trace( " > "+s+": "+Evt.info[s]);
			}
		}
		
		/** Standard error event handler - print out event info */
		public function onError( Evt:Object ):void {
			trace('[onError]');
			for( var s:String in Evt ){
				trace( " > "+s+": "+String(Evt[s]) );
			}	
		}

		/** User-defined error event handler - this is sent to Flash by custom AMF headers in response packet */
		public function onCustomError( Err:Object ):void {
			trace('[onCustomError]');
			for( var s:String in Err ){
				trace( " > "+s+": "+String(Err[s]) );
			}
		}
		
		/** Successful Response handler - simple trace of top-level response data */
		public function onResponse( returnValue:Object ):void{
			// @todo full dump .... 
			trace('[onResponse] ('+typeof returnValue+') "'+String(returnValue)+'"');
		}
		
		
		/** Failed response handler - simple print out of fault - which is probably scalar */
		public function onFault( f:Object ):void{
			trace('[onFault] `'+ ( f as String ) + '`');
		}
		
		
		
	}
	
	
	
	
	
	
	
	
	
	
	
	
}