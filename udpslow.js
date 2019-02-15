const udp = require('dgram');
function udpslow(delay){
	this.sock=udp.createSocket("udp4");
	this.queue=[];
	this.delay=delay;
	this.timer=setInterval(()=>{
		let item=this.queue.shift();
		
		if(item)
		this.sock.send(item.data,item.start,item.len,item.port,item.ip);

	},delay);
	this.send=function(data,start,len,port,ip){
		this.queue.push({data:data,start:start,len:len,port:port,ip:ip});
	}
	this.on=function(type,f){
		this.sock.on(type,f);
	}
	this.bind=function(port,ip){
		this.sock.bind(port,ip)
	}
	
}
var output=function(){
	
}
output.createSocket=function(type,delay){
		if(type=="udp4")
			return new udpslow(delay);
	}
module.exports=output;