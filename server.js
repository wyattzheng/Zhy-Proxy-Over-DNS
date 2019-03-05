var httpproxy = require('http-proxy');
var dnspacket=require("./zdns.js");

const dgram = require('dgram'); 
const tcp = require('net');
const dns = require('dns');
const rzlib = require('./rzlib.js');

//const server = dgram.createSocket('udp4');
const fs = require('fs');
var base32 = require("./base32.js");

var zhybaseencode=base32.encode;
var zhybasedecode=base32.decode;


/*
server.on('listening', () => {
  const address = server.address()
//  console.log(`server listening ${address.address}:${address.port}`)
})
server.on('message',(msg,rinfo)=>{
let pk=new dnspacket(msg);
pk.flag_QR=1;
pk.flag_RCODE=0;


pk.answers.push({domain:"tst.",type:"TXT",class:1,ttl:255,data:"1234.555."})

console.log(pk.encode(),pk,rinfo);
server.send(pk.encode(),rinfo.port);

 });*/
 
 
 function zdns_server(domain){
	this.com={};

	let sock=dgram.createSocket('udp4');
	function encode(buf){
		let res=zhybaseencode(buf).replace(/\//g,"-").replace(/=/g,"_");
		let ret="";
		for(let i=0;i<res.length;i+=250)
			ret+=res.substring(i,i+250)+".";
		
		return ret;
	}
	function decode(str){
		return Buffer.from(zhybasedecode(str.replace(/\./g,"").replace(/-/g,"/").replace(/_/g,"=")));
	}
	function encode2(buf){
		let res=buf.toString("base64").replace(/\//g,"-").replace(/=/g,"_");
		let ret="";
		for(let i=0;i<res.length;i+=250)
			ret+=res.substring(i,i+250)+".";
		return ret;
		}

	this.recv=(callback)=>{
		this.recvcallback=callback;
	}
	this.gctimer=setInterval(()=>{
		for(var i in this.com)
		{if(this.com[i].live<0)
		delete this.com[i];
else
this.com[i].live--;}
	},1000);
	this.handlemessage=(msg,r)=>{
	var pk=new dnspacket(msg);
	if(pk.queries.length>0)
	{
			
		if(pk.queries[0].type!="TXT")return;
		
	//	let queryname=pk.queries[0].name.substring(0,pk.queries[0].name.indexOf(".")+1);
		let queryname=pk.queries[0].name.substring(0,pk.queries[0].name.indexOf("."+domain+".")).split(".").join("");
		
		let datas=[];let floc=queryname.indexOf("-");
		let comdata=queryname.substring(0,floc).split("l");
		let sendid=parseInt(comdata[0]);let askid=parseInt(comdata[1]);let comid=parseInt(comdata[2]);let msgkind=comdata[3];let msgid=comdata[4];

		if(!this.com[comid])this.com[comid]={info:r,msgs:[],message:Buffer.alloc(0),dnspacketid:0,sendpacketid:0,sendpacketcache:{},packetqueue:{},live:100};
		this.com[comid].live=100;


		let data=decode(queryname.substring(floc+1,queryname.length));

		//===================ABOUT HEARTBEAT==================
		let isHeartbeat=data.length<50&&data.toString().substr(0,5)=="zhb~.";
		if(isHeartbeat){


		this.com[comid].userpacketid=askid-10;

		if(this.com[comid].packetqueue[askid])
		{	
		pk.answers=JSON.parse(JSON.stringify(this.com[comid].packetqueue[askid].answers));
		pk.answers[0].domain=Buffer.from([192,12]);
		pk.answers[0].data=this.com[comid].sendpacketid+"l"+pk.answers[0].data;

		}
		else pk.answers.push({domain:Buffer.from([192,12]),type:"TXT",class:1,ttl:1,data:"I ALWAYS EXIST."+this.com[comid].sendpacketid+"."});

		}	else pk.answers.push({domain:Buffer.from([192,12]),type:"TXT",class:1,ttl:1,data:"I ALWAYS EXIST."+this.com[comid].sendpacketid+"."});


		pk.flag_QR=1;pk.flag_RD=1;pk.flag_RA=1;pk.flag_RCODE=0;
		let ra=pk.encode();
		sock.send(ra,0,ra.length,r.port,r.address)

		//===================ABOUT HEARTBEAT==================
		
		//===================ABOUT SENDING RELIABLE===========
		let expectid=(this.com[comid].sendpacketid+1)>60000?0:(this.com[comid].sendpacketid+1);

		if(!isHeartbeat){

		if(sendid!=expectid){
			if(!this.com[comid].sendpacketcache[sendid])
			this.com[comid].sendpacketcache[sendid]={msg:msg,r:r};

			if(this.com[comid].sendpacketcache[expectid])
				this.handlemessage(this.com[comid].sendpacketcache[expectid].msg,this.com[comid].sendpacketcache[expectid].r)
			return;}
		
		
		this.com[comid].sendpacketid=sendid;
		
		}
//				if(!isHeartbeat)console.log(queryname);

		//===================ABOUT SENDING RELIABLE===========
		
		
		
		if(queryname=="testzhy")
		{

			let testpacket=pk;

			testpacket.answers.push({domain:pk.queries[0].name,type:"TXT",class:1,ttl:255,data:"You have already succeed in building ZHY's HTTP-Proxy over DNS Server.This message is sent from it :) ."})

/*for(let i=0;i<1;i++)
{
let s="";
for(let j=0;j<10;j++)
s+="==============TEST"+Math.round(Math.random()*10000)+"===============";

			testpacket.answers.push({domain:pk.queries[0].name,type:"TXT",class:1,ttl:255,data:encode(s)});
}*/
			testpacket.id=pk.id;
			testpacket.flag_QR=1;
			testpacket.flag_RD=1;
			testpacket.flag_RA=1;
			testpacket.flag_RCODE=0;
			let raw=testpacket.encode();
/*let hackpk=new dnspacket(fs.readFileSync("debug.txt"));
//hackpk.queries[0].name=pk.queries[0].name;
//hackpk.queries=[];
hackpk.answers[0].domain=Buffer.from([192,12]);
hackpk.id=pk.id;
console.log(hackpk);

raw=hackpk.encode();*/

raw=fs.readFileSync("debug.txt");
			sock.send(raw,0,raw.length,r.port,r.address);



			return;
		}
		//=============ABOUT DATA CONCAT==========
		if(!isHeartbeat){
		this.com[comid].message=Buffer.concat([this.com[comid].message,data]);
	
		if(msgkind=="e"){
		let combinedata=Buffer.concat([this.com[comid].message]);
		this.com[comid].message=Buffer.alloc(0);
		if(this.recvcallback)
			this.recvcallback(comid,combinedata);

		}
		
		}
		//=============ABOUT DATA CONCAT==========
		

//		pk.queries[0].name=Buffer.from([192,12]);




	
	}
		
	}
	
	sock.on("message",this.handlemessage)
	this.buildpacket=()=>{
		for(var comid in this.com)
		if(this.com[comid].msgs.length>0){
		let count=0;let countlen=0;let pk=new dnspacket();
		
		do{
		let d=this.com[comid].msgs.shift();

		let splitlen=1024;
		countlen+=d.length;


		for(let j=0;j<d.length;j+=splitlen)
		pk.answers.push({domain:Buffer.from([192,12]),type:"TXT",class:1,ttl:count,data:encode2(d.slice(j,j+splitlen))})


		count++;
		if(countlen>0)break;//此为单个DNS封包的最大允许大小

		}while(this.com[comid].msgs.length>0);

		//pk.answers.unshift({domain:Buffer.from([192,12]),type:"TXT",class:1,ttl:0,data:(this.com[comid].dnspacketid+".")});
		pk.answers[0].data=this.com[comid].dnspacketid+"."+pk.answers[0].data

		pk.flag_QR=1;pk.flag_RD=1;pk.flag_RA=1;pk.flag_RCODE=0;

		this.com[comid].packetqueue[this.com[comid].dnspacketid]=pk;
//		if(this.com[comid].packetqueue.length>=5){
	
			/*let keys=Object.keys(this.com[comid].packetqueue);
			keys.sort((a,b)=>(a-b));
			if(this.com[comid].userpacketid)
			for(var k in keys)
			if(keys[k]<this.userpacketid)
			if(this.com[comid].packetqueue[keys[k]])
			delete this.com[comid].packetqueue[keys[k]];
			*/

	//	}
		


		this.com[comid].dnspacketid++;
		if(this.com[comid].dnspacketid>60000)this.com[comid].dnspacketid=0;
		
		}
	}
	this.send=(comid,data)=>{
		//if(this.com[comid])//seems wrong

try{
	if(this.com[comid])
{
		this.com[comid].msgs.push(data);
		this.com[comid].live=100;
}
}catch(e){console.log(comid);process.exit()}
		this.buildpacket();
	}
	sock.bind(53,"178.128.57.53");
	//setInterval(()=>{},1000);
}

function tcpserveroverzdns(domain){
	this.zdns=new zdns_server(domain);
	this.connections={};
	this.SETs={};//记录所有桥的组
	this.SETsINFO={};//记录每个组的信息

	this.sendingqueue=[];
	this.whichSET=(id)=>{//搜寻某个id的桥来自哪个组
	
	
	for(var set in this.SETs)
		if(this.SETs[set])
		for(let i=0;i<this.SETs[set].length;i++)
		if(this.SETs[set][i].id==id)
		return parseInt(set);
	return -1;
	}

	this.gctimer=setInterval(()=>{
		
		for(var i in this.connections)
if(this.connections[i].Timeout){	
	//	this.connections[i].Timeout-=1000;
		if(this.connections[i].Timeout<=0){
	//		this.zdns.send(i,encode("end"));
//this.connections[i].destroy();
//delete this.connections[i];

		}	
			
		
			
		}
		
	},1000);
	
	this.handleTimer=(async()=>{
		let sleep=(tm)=>{
			return new Promise((y)=>setTimeout(y,tm));
		}
		while(true){
		let rawinfo=this.sendingqueue.shift();
		if(!rawinfo){await sleep(100);continue;}
			
		let raw=rawinfo.r;
		let set=rawinfo.s;
		
		
		await rz.gzip(raw).then((dat)=>{
		if(dat.length==0||dat.length>=raw.length)
			dat=raw;
		
				if(this.connections[set]){
				this.connections[set].Timeout=5000;

				let splitat=260;

				let partid=0;let partcounts=0;

				for(var i=0;i<=dat.length;i+=splitat)partcounts++;
				let besent=[];

				if(partcounts<this.SETs[set].length)
				for(var i=0;i<(this.SETs[set].length-partcounts);i++)
				{besent.push(Buffer.alloc(0));
				}

				for(var i=0;i<=dat.length;i+=splitat)
				{
					let part=dat.slice(i,i+splitat);
					besent.push(part);
				}


				for(var i in besent)
				{
					let target;
				if(i<this.SETs[set].length)
					target=this.SETs[set][i%this.SETs[set].length].id;
			else
					target=this.SETsINFO[set].selector(besent.length,i);

					this.zdns.send(target
							,encode("d|"+i+"|"+besent.length+"|"+this.SETsINFO[set].dataid+"|0",besent[i]))
		//			console.log(this.SETsINFO[fromset].dataid,partcounts,i);
				}



					this.SETsINFO[set].dataid++;

			
				}
		});
		
		}
	})();
	function encode(action,data){
		if(!data)data=Buffer.alloc(0);
	let buf=Buffer.alloc(2+action.length+2+data.length);
	let offset=0;
	buf.writeUInt16BE(action.length,offset);offset+=2;
	Buffer.from(action).copy(buf,offset);offset+=action.length;
	buf.writeUInt16BE(data.length,offset);offset+=2;
	data.copy(buf,offset);offset+=data.length;
	return buf;
	}
	function decode(raw){
		let ret={action:"",data:Buffer.alloc(0)};
		let offset=0;
		let actionlen=raw.readUInt16BE(offset);offset+=2;
		ret.action=raw.slice(offset,offset+actionlen)+"";offset+=actionlen;
		let datalen=raw.readUInt16BE(offset);offset+=2;
		ret.data=raw.slice(offset,offset+datalen);offset+=datalen;
		return ret;
	}
	var rz=new rzlib();//reliable zlib
	
	this.send=async (set,raw)=>{
		this.sendingqueue.push({s:set,r:raw});
		
	}
	

	this.applyfor=(idinfo,setid)=>{

                        if(!this.SETs[setid])this.SETs[setid]=[];
			let idarr=idinfo.split(":");
			let id=parseInt(idarr[0]);let sup=idarr[1];
                        this.SETs[setid].push({id:id,support:sup});//声明该id的桥是同一个组的

                       // this.zdns.send(id,encode("applysuccess|"+id+"|"+setid+"|"+(this.SETs[setid].length-1)));
//                      console.log(this.SETs);

                        this.SETsINFO[setid]={count:0,count2:0,dataid:0,endid:0,sendingdata:{}};

                        var that=this;
                        this.SETsINFO[setid].selector=function(len,pid){//修改包选择器允许负载均衡的实现
				//if(len<10)return that.SETs[setid][0].id;
/*				let co=that.SETsINFO[setid].count;
				let bs=Object.keys(that.SETs[setid]).length;
				let part=parseInt(len/100);
*/
			let bs=Object.keys(that.SETs[setid]).length;
			let loc=-1;
			let pool=[];
			for(var u in that.SETs[setid])
				{
				let cu=parseFloat(that.SETs[setid][u].support).toFixed(2)*100;
				for(let j=0;j<cu;j++)
					pool.push(that.SETs[setid][u].id);
				}

				let lo=parseInt(Math.random()*100);
                                let ret=pool[lo];

				/*if(pid<bs){
					ret=that.SETs[setid][that.SETsINFO[setid].count2%bs].id;
					that.SETsINFO[setid].count2++;

				}*/
			//console.log(that.SETsINFO[setid].count2,bs,that.SETs[setid][that.SETsINFO[setid].count2%bs])
                                that.SETsINFO[setid].count++;

                                return ret;

                        }

	}
	this.zdns.recv((id,data)=>{
		var fromset=this.whichSET(id);
try{
		var ret=decode(data);
}catch(e){console.log(data+"");return;}


//		let arr,ip,port,domainname;

//console.log(ret,fromset,this.SETs)

		switch(ret.action.split("|")[0]){
			/*case "applyfor":
			let infoarr=ret.action.split("|");
			var setid=infoarr[1];

			if(!this.SETs[setid])this.SETs[setid]=[];
			this.SETs[setid].push(id);//声明该id的桥是同一个组的

			this.zdns.send(id,encode("applysuccess|"+id+"|"+setid+"|"+(this.SETs[setid].length-1)));
//			console.log(this.SETs);

			this.SETsINFO[setid]={count:0};

			var that=this;
			this.SETsINFO[setid].selector=function(){//修改包选择器允许负载均衡的实现

				let ret=that.SETs[setid][that.SETsINFO[setid].count%(Object.keys(that.SETs[setid]).length)];

				that.SETsINFO[setid].count++;
				return ret;

			}
			break;*/

			case "connect":
			let arr=ret.action.split("|");let ip;let domainname=arr[1];let port=parseInt(arr[2])+0;
		if(this.connections[fromset])
			delete this.connections[fromset];


		//	sock.setTimeout(sock.Timeout);
		console.log("尝试连接",arr);
		let cb=(err,r)=>{
		if(r){

			ip=r[0];
try{
			let sock=new tcp.Socket();
			sock.Timeout=5000;
		//		sock.on("timeout",()=>{delete this.connections[fromset];});
			sock.on("error",()=>{this.zdns.send(id,encode("end"));delete this.connections[fromset];});

			sock.connect(port,ip,()=>{
		this.SETs[arr[4]]=[];this.SETsINFO[arr[4]]={count:0};
		let bs=arr[3].split(",");

		for(var o in bs)
		this.applyfor(bs[o],parseInt(arr[4]));

		fromset=parseInt(arr[4]);

		this.zdns.send(id,encode("connected",Buffer.from(ip+":"+port)));

		console.log("连接成功",arr);
				sock.Timeout=99999999999;
				sock.on("close",()=>{
		this.zdns.send(this.SETs[fromset][0].id,encode("end"));
//			console.log("连接关闭",this.connections[fromset].address().address+":"+this.connections[fromset].address().port);

			delete this.connections[fromset];
			

			});
			sock.on("end",()=>{
			//console.log(id,"end");
			pcounts=this.SETs[fromset].length;
		for(var i in this.SETs[fromset])
			this.zdns.send(this.SETs[fromset][i].id,encode("end|"+i+"|"+pcounts+"|"+this.SETsINFO[fromset].endid));

			this.SETsINFO[fromset].endid++;

			delete this.connections[fromset];

			});
			
			//setTimeout(()=>this.zdns.send(id,encode("end")),5000);
			//this.zdns.coxx=0;
					
			sock.on("data",(dat)=>{
			if(!this.connections[fromset])return;
							let str=(dat+"");
				if(str.substring(0,4)=="HTTP")
			console.log("得到数据",str.split("\r\n")[0]);
			else console.log("得到数据",dat.length,this.connections[fromset].address());
for(let i=0;i<=dat.length;i+=2048*this.SETs[fromset].length)			
this.send(fromset,dat.slice(i,i+2048*this.SETs[fromset].length));

			});
//				sock.dataid=0;
//				sock.endid=0;
				this.connections[fromset]=sock;
		
			
			});
}catch(e){};

		}

			};
			
			if(/^(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])$/.test(domainname))
				cb("",[domainname])
			else
			dns.resolve4(domainname,cb);

			break;
			case "send":
			let ar=ret.action.split("|");let donm=ar[1];let po=parseInt(ar[2])+0;	
			if(this.connections[fromset]){
			this.connections[fromset].Timeout=5000;
//console.log(ret.data+"");

			console.log("发送数据",ret.data.length,this.connections[fromset].address());
			this.connections[fromset].write(ret.data);
			}
			case "s":
			let mr=ret.action.split("|");
			if(!this.connections[fromset])return;
			if(!this.SETsINFO[fromset].sendingdata)
			this.SETsINFO[fromset].sendingdata={};
			if(!this.SETsINFO[fromset].sendingdata[mr[1]])
			this.SETsINFO[fromset].sendingdata[mr[1]]={};

			this.SETsINFO[fromset].sendingdata[mr[1]][mr[2]]=ret.data;


			if(Object.keys(this.SETsINFO[fromset].sendingdata[mr[1]]).length==parseInt(mr[3]))
				{
				let ds=[];
				for(let i=0;i<parseInt(mr[3]);i++)
						ds.push(this.SETsINFO[fromset].sendingdata[mr[1]][i]);
				let fdata=Buffer.concat(ds);
			console.log("发送数据",fdata.length,this.connections[fromset].address());

				this.connections[fromset].write(fdata);
				}

			break;
			case "close":
		//	this.zdns.send(id,encode("end"));
			//this.connections[id].disconnect();
			delete this.connections[fromset];


			break;
		}
		
	});
		
}

let se=(new tcpserveroverzdns("proxyoverdns.math.cat"))

//let se=new zdns_server("fq.math.cat");
//se.recv((id,data)=>{console.log(id,data.length)});
