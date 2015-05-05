var express = require('express'),
fs = require('fs'),
app = express(),
http=require('http'),
url=require('url'),
mkpath = require('mkpath'),
smt = require("./smt");

var tr=smt.tr

smt.tr( '>>>>>> start server >>>>>>>>');



var resBody=""
//express  prepare
app.use(express.bodyParser());


app.get('/', function(req, res){
	res.send('server is on!');
});


app.all('/*', function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "X-Requested-With");
  next();
});

app.get('/crossdomain.xml',
 function(req,
 res){
	res.send('<?xml version="1.0" encoding="UTF-8"?>'+
'<!DOCTYPE cross-domain-policy SYSTEM "http://www.macromedia.com/xml/dtds/cross-domain-policy.dtd">'+
'<cross-domain-policy>'+
  '<site-control permitted-cross-domain-policies="master-only"/>'+
  '<allow-access-from domain="*"/>'+
  '<allow-http-request-headers-from domain="*" headers="*"/>'+
'</cross-domain-policy>');

});

app.get('/senturl', function(req,res) {
	
//	var orgurl = req.url	
//	var urlParts = url.parse(orgurl, true);
//	var urlQuery = urlParts.query;
//	var sentQuery =urlQuery
	var urlQuery =req.query
	var returnText=""
	var sentPort=80
	var addslash=req.query["addslash"]

    var sentUrl=unescape(req.query["url"])
    
     if (sentUrl.indexOf("://") == -1)
    {
    	sentUrl="http://"+sentUrl
	}

    if (sentUrl.lastIndexOf("/")!=sentUrl.length-1 && sentUrl.indexOf("?")==-1 && addslash ==1 )
	{
		//sentUrl=sentUrl.substring(0,sentUrl.length-1)
		sentUrl=sentUrl+"/"
		smt.tr("changed",sentUrl)	
	}
  
	var sentQuery=url.parse(sentUrl).query
    var sentMethod=req.query["method"]|| "GET"
    var sentdata={}
   if( sentMethod.toUpperCase() !="GET" && sentMethod.toUpperCase() !="POST"){
	   sentMethod="GET"
   }

	var  hostPath=sentUrl.substring(sentUrl.indexOf("://")+3)	
    var	 sentHost=hostPath.substring(0,hostPath.indexOf("/")) || hostPath 
    var  sentPath=hostPath.substring(hostPath.indexOf("/"))
    	 if (sentPath==sentHost){ sentPath = "/" }
	
	if(sentPath.indexOf("?")>=0){
		
		sentPath=sentPath.substring(0,sentPath.indexOf("?"))
		
		if (sentPath.lastIndexOf("/")!=sentPath.length-1  &&  addslash ==1 )
		{
			sentPath=sentPath+"/"
		}
	}

	if (sentQuery!= null){
	sentPath=sentPath+"?"+sentQuery
	}
	
	
	if (sentHost.indexOf(":")>=0)
	{
		sentPort=sentHost.substring(sentHost.indexOf(":")+1,sentHost.length)
		sentHost=sentHost.substring(0,sentHost.indexOf(":"))
	}

  	smt.tr("sentMethod: "+sentMethod+
				 "  \n sentUrl: "+ sentUrl+
				 "  \n sentHost: "+sentHost+
				 "  \n sentpath: "+sentPath+
				 "  \n sentQuery: "+sentQuery+
				 "  \n sentPort: "+sentPort
			)

    var slashQuery=sentUrl.split("/")
	var  i=0
	var opts = {
	  hostname: sentHost,
	  port: sentPort,
	  path: sentPath,
	  method: sentMethod,
	};

	var req = http.request(opts, function(res) {
	  console.log('STATUS: ' + res.statusCode);
	  console.log('HEADERS: ' + JSON.stringify(res.headers));
		
	  var returnStatus = res.statusCode;
	  var returnHeaders= JSON.stringify(res.headers);
	  res.setEncoding('utf8');
	  
	  var returnBody=""
	  res.on('data', function (chunk) {
	//    console.log('BODY: ' + chunk);
	  i++
	 
	  returnBody = returnBody +chunk;
	  });

	  res.on("end", function(res){
	  	resBody=returnBody
	  	sentToPage(resBody)
	  })
	  
	});

	
	req.on('error', function(e) {
	  console.log('problem with request: ' + e.message);
	});
	// write data to request body
	//req.write('data\n');
//	sentQuery='{ cid:"LG1XJ"}'
	
	smt.tr("sentQuery: "+sentQuery)
	if (sentQuery!=null && sentQuery!=undefined)
		{req.write(sentQuery);}

	req.end();
	returnText="";
	
	function sentToPage(resBody){
	res.send(   
				// "<br>   sentMethod:"+sentMethod+
				// "<br>   sentUrl:"+ sentUrl+
				// "<br>   sentHost:"+sentHost+
				// "<br>   sentpath:"+sentPath+
				//"<br>   returnBody:"+ 
				resBody);
	}
		
})



function jsonpcallback(){
	res.send( resBody);
}


app.listen(8085);
smt.tr( 'Listening on port 8085');