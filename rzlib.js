var zlib=require('zlib');
var LZMA=require('./lzma_binary/src/lzma.js').LZMA;
function rzlib(){
var lzma=new LZMA();
	
this.id=0;
this.rid=0;
this.deflate=(raw)=>{
this.id++;
var nowid=this.id;
return new Promise((y)=>{
zlib.deflate(raw,(err,msg)=>{
this.rid++;
let nowrid=this.rid;
let timer=setInterval(()=>{if(nowid==nowrid){clearInterval(timer);if(err || msg.length>=raw.length)y(raw);else y(msg);}},10);});

})
}


this.inflate=(raw)=>{
this.id++;
var nowid=this.id;
return new Promise((y)=>{
zlib.inflate(raw,(err,msg)=>{
this.rid++;
var nowrid=this.rid;
let timer=setInterval(()=>{if(nowid==nowrid){clearInterval(timer);if(err)y(raw);else y(msg);}},10);});


});

}

this.gunzip=(raw)=>{
this.id++;
var nowid=this.id;
return new Promise((y)=>{
zlib.gunzip(raw,(err,msg)=>{
this.rid++;
var nowrid=this.rid;
let timer=setInterval(()=>{if(nowid==nowrid){clearInterval(timer);if(err)y(raw);else y(msg);}},10);});


});

}
this.gzip=(raw)=>{
this.id++;
var nowid=this.id;
return new Promise((y)=>{
zlib.gzip(raw,(err,msg)=>{
this.rid++;
var nowrid=this.rid;
let timer=setInterval(()=>{if(nowid==nowrid){clearInterval(timer);if(err || msg.length>=raw.length)y(raw);else y(msg);}},10);});


});

}

this.lzma_comp=(raw)=>{
this.id++;
var nowid=this.id;
return new Promise((y)=>{
	
lzma.compress(raw,9,(msg,err)=>{
this.rid++;
var nowrid=this.rid;msg=Buffer.from(msg);
let timer=setInterval(()=>{if(nowid==nowrid){clearInterval(timer); y(msg);}},10);


});


});

}

this.lzma_decomp=(raw)=>{
this.id++;
var nowid=this.id;
return new Promise((y)=>{
lzma.decompress(raw,(msg,err)=>{
	this.rid++;

var nowrid=this.rid;//msg=Buffer.from(msg);

let timer=setInterval(()=>{if(nowid==nowrid){clearInterval(timer);y(msg);}},10);


});


});

}


}

//let rz=new rzlib();
//rz.lzma_comp(Buffer.from("...")).then(rz.lzma_decomp).then((m)=>console.log(m))
	

module.exports=rzlib;
