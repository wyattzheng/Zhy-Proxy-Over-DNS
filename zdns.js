function dnspacket(raw){
	var typecat={
		1:"A",
		2:"NS",
		5:"CNAME",
		6:"SOA",
		11:"WKS",
		12:"PTR",
		13:"HINFO",
		15:"MX",
		16:"TXT",
		28:"AAAA",
		252:"AXFR",
		255:"ANY",
	};
	for(var i in typecat)
		typecat[typecat[i]]=parseInt(i);
	
	
	var offset=0;
	if(!raw)raw=Buffer.alloc(4*7);
	this.id=raw.readUInt16BE(offset);offset+=2;
	let flags=raw.readUInt16BE(offset);offset+=2;
	this.flag_QR=flags >>15 & 1
	this.flag_opcode=flags>>11 & 15
	this.flag_AA=flags>>10 & 1
	this.flag_TC=flags>>9 & 1
	this.flag_RD=flags>>8 & 1
	this.flag_RA=flags>>7 & 1
	//ZERO x 3bit
	this.flag_RCODE=flags>>0 & 15
	
	
	
	let questions=raw.readUInt16BE(offset);offset+=2;
	let answerRRs=raw.readUInt16BE(offset);offset+=2;//回答 记录资源数 Answer Recorded Resources.
	let anthRRs=raw.readUInt16BE(offset);offset+=2;//授权 记录资源数
	let addRRs=raw.readUInt16BE(offset);offset+=2;//附加 记录资源数
	
	//查询区域
	this.queries=[];

	for(let i=0;i<questions;i++){
	
	let query={name:"",type:"",class:0};
	
	if(raw.readUInt8(offset)==192)
	{query.name=="pointer";offset+=2;
	}
	do{
	let len=raw.readUInt8(offset);offset+=1;if(len<=0)break;
	query.name+=raw.slice(offset,offset+len)+".";offset+=len;//查询问题区域
	
	}while(true);

	query.type=typecat[raw.readUInt16BE(offset)];offset+=2;
	query.class=raw.readUInt16BE(offset);offset+=2;//查询类
	this.queries.push(query);
	}
	
	//this.authnameservers=raw.readUInt32BE(offset);offset+=4;//授权区域
	//this.add=raw.readUInt32BE(offset);offset+=4;//附加区域
	
	//资源区域
	this.answers=[];
	for(let i=0;i<answerRRs;i++){
	let r={domain:"",type:"",class:"",ttl:0,data:""};
	if(raw.readUInt8(offset)==192)//指针
	{r.domain="pointer";offset+=2;
	}
	else{do{
	let len=raw.readUInt8(offset);offset+=1;if(len<=0)break;
	r.domain+=raw.slice(offset,offset+len)+".";offset+=len;
	
	}while(true);}
	
	r.type=typecat[raw.readUInt16BE(offset)];offset+=2;
	r.class=raw.readUInt16BE(offset);offset+=2;
	r.ttl=raw.readUInt32BE(offset);offset+=4;
	let datalen=raw.readUInt16BE(offset);offset+=2;
	let tmpdata=raw.slice(offset,offset+datalen);offset+=datalen;
	let off=0;
	do{
	let len=tmpdata.readUInt8(off);off+=1;if(len<=0)break;

	r.data+=tmpdata.slice(off,off+len)+".";off+=len;//查询问题区域
	
	}while(true);
	
	this.answers.push(r);
	//console.log(this.answers);
	}
	this.encode=function(){
	let offset=0;let ret=Buffer.alloc(1024*10);
	ret.writeUInt16BE(this.id,offset);offset+=2;
	let flags=0;
	flags|=this.flag_QR<<15;
	flags|=this.flag_opcode<<11;
	flags|=this.flag_AA<<10;
	flags|=this.flag_TC<<9;
	flags|=this.flag_RD<<8;
	flags|=this.flag_RA<<7;
	flags|=this.flag_RCODE<<0;
	ret.writeUInt16BE(flags,offset);offset+=2;
	ret.writeUInt16BE(this.queries.length,offset);offset+=2;
	ret.writeUInt16BE(this.answers.length,offset);offset+=2;
	ret.writeUInt16BE(0,offset);offset+=2;
	ret.writeUInt16BE(0,offset);offset+=2;
	
	for(var i in this.queries)
	{	

if(Buffer.isBuffer(this.queries[i].name))
{
this.queries[i].name.copy(ret,offset);offset+=this.queries[i].name.length;

}else{
		 let arr=this.queries[i].name.split(".")
		for(var j in arr)
		{
			ret.writeUInt8(arr[j].length,offset);offset+=1;
		let buf=Buffer.from(arr[j]);buf.copy(ret,offset);offset+=buf.length;
		}
}		
		ret.writeUInt16BE(typecat[this.queries[i].type],offset);offset+=2;
		ret.writeUInt16BE(this.queries[i].class,offset);offset+=2;

	}
	for(var i in this.answers)
	{
		if(typeof this.answers[i].domain=="object" && Buffer.isBuffer(this.answers[i].domain))
{
this.answers[i].domain.copy(ret,offset);offset+=this.answers[i].domain.length;

}else{
		let arr=this.answers[i].domain.split(".");
		//console.log(arr);
		for(var j in arr)
		{
			ret.writeUInt8(arr[j].length,offset);offset+=1;
		let buf=Buffer.from(arr[j]);buf.copy(ret,offset);offset+=buf.length;
		}
}
			ret.writeUInt16BE(typecat[this.answers[i].type],offset);offset+=2;
			ret.writeUInt16BE(this.answers[i].class,offset);offset+=2;
			ret.writeUInt32BE(this.answers[i].ttl,offset);offset+=4;
			let data=Buffer.from(this.answers[i].data);

			let ar=this.answers[i].data.split(".");
			ret.writeUInt16BE(data.length+1,offset);offset+=2;
try{
			for(var j in ar)
			{
			ret.writeUInt8(ar[j].length,offset);offset+=1;
			let buf=Buffer.from(ar[j]);buf.copy(ret,offset);offset+=buf.length;
			}
}catch(e){console.log(this.answers[i].data);process.exit();}			
		//	data.copy(ret,offset);offset+=data.length;
	}
	
	
return ret.slice(0,offset);	

}

}
/*
let pk=new dnspacket();
pk.answers.push({domain:"test.",type:"TXT",class:1,ttl:255,data:"asd."});
pk.answers.push({domain:"test.",type:"TXT",class:1,ttl:255,data:"asd.asdasd.adssad."});
pk.answers.push({domain:"test.",type:"TXT",class:1,ttl:255,data:"asdd.sadsa."});
pk.answers.push({domain:"test.test.test.test.",type:"A",class:1,ttl:255,data:"asdd.sadsa__.sadsa__."});
pk.answers.push({domain:"test.test.test.test.",type:"A",class:1,ttl:255,data:"asdd.sadsa__.sadsa__."});
pk.answers.push({domain:"test.test.test.test.",type:"A",class:1,ttl:255,data:"asdd.sadsa__.sadsa__."});
pk.queries.push({name:"test.test.",type:"TXT",class:1});

console.log(new dnspacket(pk.encode()));
*/
module.exports=dnspacket;
