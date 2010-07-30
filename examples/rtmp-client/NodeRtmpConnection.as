/**
 * Extended NetConnection to test AMF requests
 * Set "host" variable to your nodejs http end point
 */



package {
	
	import flash.utils.setTimeout;
	import flash.net.NetConnection;
	import flash.net.NetStream;
	import flash.net.ObjectEncoding;
	import flash.net.Responder;
	
	import flash.events.NetStatusEvent;
	import flash.events.IOErrorEvent;
	import flash.events.AsyncErrorEvent;
	import flash.events.SecurityErrorEvent;
	
	public class NodeRtmpConnection extends NetConnection {
		
		private var host:String = 'rtmp://192.168.51.6:1935/test';
		private var responder:Responder;
		private var stream:NetStream;
		
		/**
		 * Constructor 
		 */
		function NodeRtmpConnection(){
			addEventListener( NetStatusEvent.NET_STATUS, onNetStatus );
			addEventListener( IOErrorEvent.IO_ERROR, onError );
			addEventListener( AsyncErrorEvent.ASYNC_ERROR, onError );
			addEventListener( SecurityErrorEvent.SECURITY_ERROR, onError );
			objectEncoding = ObjectEncoding.AMF3;
			connect(host);
		}

		
		private function connectStream():void {
			stream = new NetStream(this);
            stream.addEventListener(NetStatusEvent.NET_STATUS, onNetStatus);
            stream.client = this;
        }
		
		public function onMetaData(info:Object):void {
			trace("metadata: duration=" + info.duration + " width=" + info.width + " height=" + info.height + " framerate=" + info.framerate);
		}
		
		public function onCuePoint(info:Object):void {
			trace("cuepoint: time=" + info.time + " name=" + info.name + " type=" + info.type);
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
		public function onResponse( returnValue:Object, s:Object = ''):void {
			trace('[onResponse] '+s);
			dump( returnValue, '', '' );
		}
		
		
		/** Failed response handler - simple print out of fault - which is probably scalar */
		public function onFault( f:Object ):void{
			trace('[onFault] `'+ ( f as String ) + '`');
		}
		
		
		/** simple dump function for inspecting returned structures */
		private static function dump( value:*, tab:String = '', name:String = '' ):void {
			var prefix:String = tab;
			if( name ){
				prefix += '['+name+'] ';
			}
			if( value === undefined ){
				return trace( prefix + '(undefined)' );
			}
			if( value === null ){
				return trace( prefix + '(null)' );
			}
			if( value is Number ){
				return trace( prefix + '(Number) '+ value );
			}
			if( value is String ){
				return trace( prefix + '(String) "'+ value+'"' );
			}
			if( value is Boolean ){
				return trace( prefix + '(Boolean) '+ (value?'true':'false') );
			}
			if( value is Date ){
				return trace( prefix + '(Date) '+ (value as Date).toString() );
			}
			if( value.__amfref != null ){
				return trace( prefix + '(Cyclic)' );
			}
			value.__amfref = true;
			if( value is Array || value.length ){
				trace( prefix + '(Array length:'+value.length+') ');
			}
			else {
				trace( prefix + '(Object)');
			}
			for( var s:String in value ){
				if( s !== '__amfref' ){
					dump( value[s], ' . '+tab, s );
				}
			}
		}		
		
		
	}
	
	
	
	
	
	
	
	
	
	
	
	
}