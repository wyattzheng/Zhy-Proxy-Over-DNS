var zlib=require('zlib');
function rzlib(){
this.id=0;
this.rid=0;
this.deflate=(raw)=>{
this.id++;
var nowid=this.id;
return new Promise((y)=>{
zlib.deflate(raw,(err,msg)=>{
this.rid++;
let nowrid=this.rid;
let timer=setInterval(()=>{if(nowid==nowrid){clearInterval(timer);y(msg);}},10);});

})
}


this.inflate=(raw)=>{
this.id++;
var nowid=this.id;
return new Promise((y)=>{
zlib.inflate(raw,(err,msg)=>{
this.rid++;
var nowrid=this.rid;
let timer=setInterval(()=>{if(nowid==nowrid){clearInterval(timer);y(msg);}},10);});


});

}

this.gunzip=(raw)=>{
this.id++;
var nowid=this.id;
return new Promise((y)=>{
zlib.gunzip(raw,(err,msg)=>{
this.rid++;
var nowrid=this.rid;
let timer=setInterval(()=>{if(nowid==nowrid){clearInterval(timer);y(msg);}},10);});


});

}
this.gzip=(raw)=>{
this.id++;
var nowid=this.id;
return new Promise((y)=>{
zlib.gzip(raw,(err,msg)=>{
this.rid++;
var nowrid=this.rid;
let timer=setInterval(()=>{if(nowid==nowrid){clearInterval(timer);y(msg);}},10);});


});

}

}

//let rz=new rzlib();
//rz.deflate(Buffer.from("...")).then(rz.inflate).then(console.log)

module.exports=rzlib;
