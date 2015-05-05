var mkpath = require('mkpath');
var fs = require('fs');
var awss3 = require('./awss3');
var smt = require('./smt');
var https = require('https');
var http = require('http');
var js2xmlparser = require("js2xmlparser");
var csv = require('csv');
var json2csv = require('json2csv');
var xml2jsParse = require('xml2js').parseString;
var ftpClient = require('ftp');
var zlib = require('zlib');
var gzip = zlib.createGzip();
var trl=smt.trl
var Emitter=require('events').EventEmitter;
var nEvent = new Emitter();
var nLoadEvent = new Emitter();
var httploadedEvent = new Emitter();

var tr = smt.tr;
var creatfolder=smt.creatfolder;
var osize = smt.osize;
var downreq = smt.downreq;
var secondsToString = smt.secondsToString;
var clone = smt.clone;
var emailpack=require("./emailpack")
// //////////////////////////////////////////////////////
// loadlocal settings  custom setting file
var allsetings;
fs.readFile("../settings/allsettings.json", function(err, filedata)
	{ 
		if(err){
				var opt={}
				opt.errSMS="settings/allsettings.json not exist"
				errmail(err,{},opt)
			}else{
				if(!filedata) filedata="{}"
				allsetings = JSON.parse(filedata); 
			}
	}
);

/*
 * define all vars in current job obj, cjb
 * job @param{object} opt , opt with detailed params @param{object} opt ,
 * http request opt @param{function} callback , a callback
 */
function definecjb(cjb) {
	
	var req=cjb.req
	var res=cjb.res
	cjb.workpath=process.cwd()
	cjb.parentpath=cjb.workpath.substring(0,cjb.workpath.lastIndexOf("/"))
	cjb.customerCode = req.params.customer;
   

	var settingarr = [ "format", "delmore", "s3name", "localname", "charset",
			"encoding", "feedurl", "delarray", "delmorearray", "spliter",
			"delimiter", "delimiterext", "quote", "quoteext", "rowdelimiter", "realtimeUpload", "rmorg",
			"text1", "direct", "nodename", "rootname", "urlkey", "startline",
			 "mapurl", "buffercode" ];

	var csf = allsetings[cjb.customerCode][cjb.transMethod];

	if(!csf){
				 var erropt={}
				 erropt.errSMS="for " + cjb.customerCode +" "+ cjb.transMethod +" setting not exist"
				 errmail("setting not exist",cjb,erropt)
		}
	else{				
			cjb.csf=csf;
			if (!csf) {
				csf = {};
				settingarr.every(function(cur, index, arr) {
					if (!csf[cur]) {
						csf[cur] = "";
					};
				});
			};

			cjb.csf.sentToSubject = cjb.csf.sentToSubject || cjb.requrl
			cjb.fileSizeInBytes = 0;
			cjb.format = req.query["format"] || csf.format || "xml";
			cjb.delmore = req.query["delmore"] || csf.delmore || 0;

			cjb.s3name = req.query["s3name"] || csf.s3name || "feed_" + cjb.transMethod
					+ "." + cjb.format;
			cjb.s3keypath = cjb.customerCode + '/' + cjb.transMethod + '/';
			// only name
			cjb.localname = (req.query["localname"] || csf.localname || "feed_"
					+ cjb.transMethod)
					+ "_" + smt.gettime() + "." + cjb.format;
			cjb.jobpath = "../fetched/" + cjb.customerCode + '/' + cjb.transMethod + '/';
			// path and name 
			cjb.pathfilename = cjb.jobpath + cjb.localname;

			// this is input encoding
			cjb.buffercode = req.query["buffercode"] || csf.buffercode || "utf8";
			// output encoding in nodjs
			cjb.encoding = req.query["encoding"] || csf.encoding || "utf8";
			// this is returned charset as header,
			cjb.charset = req.query["charset"] || csf.charset || "UTF-8";

			if(csf.feedurl)  csf.feedurl = csf.feedurl.toString()
	
			cjb.feedurl = unescape(req.query["feedurl"]  || csf.feedurl );
			cjb.mapurl = unescape( req.query["mapurl"] || csf.mapurl );

			cjb.delarray = csf.delarray
					|| [ "active", "customNum1", "imageUrlBig", "inStock",
							"onPromotion", "quantityForSale", "shippingCostWithTax",
							"$", "categoryUrl" ];
			cjb.delmorearray = csf.delmorearray
					|| [ "category", "subCategory", "productFamily", "subCategoryUrl" ];

			cjb.spliter = req.query["spliter"] || req.query["spl"] || csf.spliter || ',';
			cjb.spliterext = req.query["spliterext"] || req.query["sple"] || csf.spliter || ',';

			cjb.delimiter = req.query["delimiter"] || req.query["dlm"] || csf.delimiter || '\t';
			cjb.delimiterext = req.query["delimiterext"] || req.query["dlme"] || csf.delimiterext || '\t';

			cjb.quote = req.query["quote"] || csf.quote || '\u0001';
			cjb.quoteext = req.query["quoteext"] || csf.quoteext || cjb.quote || '\u0001';

			cjb.rowdelimiter = req.query["rowdelimiter"] || req.query["rowdlm"]|| csf.rowdelimiter || '\n';
			cjb.rowdelimiterext = req.query["rowdelimiterext"] || req.query["rowdlme"]|| csf.rowdelimiterext || '\n';

			
			cjb.realtimeUpload = req.query["realtimeUpload"] || csf.realtimeUpload || 0;
			cjb.rmorg = req.query["rmorg"] || csf.rmorg || 0;
			cjb.text1 = req.query["text1"] || csf.text1 || 1;
			cjb.direct = req.query["direct"] || csf.direct || 0;
			cjb.nodename = req.query["nodename"] || csf.nodename || "product";
			cjb.rootname = req.query["rootname"] || csf.rootname || "products";
			cjb.urlkey = req.query["urlkey"] || csf.urlkey || "url";
			cjb.startline = req.query["startline"] || csf.startline || "0";

			cjb.sentToPageFlag=0
			cjb.checkjobdoneFlag=0
			//cjb.returnbody = "";
			cjb.returnChildren = [];
			cjb.returnChildrenResult = [];
			// var contenttype='text/'+format+';charset='+charset
			cjb.contenttype = 'text/' + cjb.format;
			cjb.charset ? cjb.contenttype + "; charset=" + cjb.charset : null;
			// if sent request to a server , the sent data with this header
			cjb.headers = {
				"Content-Type" : cjb.contenttype
			};

			cjb.maxErrTry= csf.maxErrTry || 5;
			cjb.nEvent=nEvent;
			cjb.multifeedcounter = 0;
			//cjb.feedurl.match(",") ? cjb.feedarray = cjb.feedurl.split(cjb.spliter) : cjb.feedarray = [cjb.feedurl];
			cjb.feedarray = cjb.feedurl.split(cjb.spliter)
			cjb.fidlength = []
			cjb.totalpiece=[]
			cjb.feedres = [];
			
			for (var c in cjb){
				if (cjb[c] == "[empty]") cjb[c]=""
			}

			creatfolder( cjb.jobpath);
	}
}

/*
 * fetch one or multipal feeds by sent a http quest @param{object} cjb , current
 * job @param{object} opt , opt with detailed params @param{function}
 * callback , a callback
 */

 function fetchfeed (cjb, opt, callback) {
	cjb.httpopts=[]
	for ( var i in cjb.feedarray) {
		tr("> fetchfeed feedurl is:", cjb.feedarray[i]);
		var fid = i;
		var port = 80;
		var sentMethod = "GET";
		var opt = {
			"url" : cjb.feedarray[i],
			"feedid" : i,
			"fid" : fid,
			"port" : port,
			"sentMethod" : sentMethod,
		};
		
		if (cjb.loadseries==1 ) {
			cjb.httpopts.push(opt)
		} else {
			httprequest(cjb, opt, callback) ;	
		}		
	};

	if (cjb.loadseries==1){
		cjb.nLoadEvent=nLoadEvent
		cjb.httploadedEvent=httploadedEvent
		cjb.nLoadEvent.on("loadedone", sentnext)	
		//nLoadEvent.on("loadedone", sentnext)
		cjb.feednext=0

		function sentnext(){
			cjb.feednext = cjb.feednext + 1
			if(cjb.feednext <= cjb.httpopts.length-1 ){
				//smt.tobj(cjb.httpopts[cjb.feednext])
				httprequest(cjb, cjb.httpopts[cjb.feednext], callback) ;	
			}
		}
		
		//start first feed
		opt=cjb.httpopts[0]
		httprequest(cjb, opt, callback) ;	
	}
};



/*
 * sent err notice email
 */
function errmail(e, cjb, opt) {
	  	tr("> errmail")
	  	var err
	  	if(!e) {
	  		var errcontent = opt.errSMS || "a default error created."
	  		err= new Error( errcontent )
	  	} else if ( typeof e == "string") {
			err= new Error( e )
	  	} else{
	  		err=e
	  	}
		if(!opt) opt={}
		opt.err=err
		opt.mailPrefix= opt.mailPrefix || "[Error]"
		
		opt.errSMS = showfullerror(cjb,opt) || 'problem details:'
		
		
		tr(opt.errSMS)
		emailpack.sentTagsEmail(cjb,opt)
		
		//sentErrPage(cjb,opt)
		checkjobdone(cjb,opt)
		
	}



/*
 * fetch one or multipal feeds by sent a http quest @param{object} cjb , current
 * job @param{object} opt , opt with detailed params @param{object} opt ,
 * http request opt @param{function} callback , a callback
 */
function httprequest(cjb, opt, callback) {
	tr("> httprequest")
	var sentHost = opt.url.match(/:\/\/[^\/]*(?=\/)/).toString().substring(3);
	var hostregex = new RegExp(sentHost+"(.*)")
	var sentPath = opt.url.match(hostregex)[1] ;
	var port = opt.port || 80
	var sentMethod = opt.sentMethod || "POST"
	var feedid=opt.feedid || "0"
	var auth = opt.auth || ""
	var feedreq;
	if (opt.url.indexOf("https:") >= 0) {
		opt.https=true;
		port= 443;
	}

	var reqopts = opt.reqopts || {
		hostname : sentHost,
		port : port,
		path : sentPath,
		method : sentMethod,
		headers : {
			"feedid" :feedid,
			'Authorization': 'Basic ' + new Buffer(auth).toString('base64')
		}
	};
	smt.tobj(reqopts)

	if (opt.https==true) {
		tr(">run https")
		feedreq = https.get(reqopts, function(feedres) {
			opt.hearders = feedres.socket._httpMessage._headers;
			opt.feedres = feedres;
			console.log(opt.hearders)
			callback(cjb, opt);
		});
	} else {
		tr(">run http")
		feedreq = http.request(reqopts, function(feedres) {
			opt.hearders = feedres.socket._httpMessage._headers;
			opt.feedres = feedres;
			callback(cjb, opt);
		});
	}
	feedreq.on('error',  smt.makecb(errmail, cjb, opt) );
	// write data to request body
	// feedreq.write('data\n');
	feedreq.end();
}



/*
 * working on http response after a http request sent , set returen data to
 * opt.returnbody @param{object} cjb , current job @param{object} opt ,
 * opt with detailed params @param{object} feedres , response object working
 * on @param{function} callback , a callback
 */
 function reqhttpCB(cjb, opt, callback) {

	var returnStatus = opt.feedres.statusCode;
	var fid = opt.fid = opt.hearders.feedid;
	var cl  = cjb.fidlength[fid] = opt.feedres.headers['content-length']
	var returnHeaders = JSON.stringify(opt.feedres.headers);
	cjb.returnChildrenResult[opt.fid] = ""

	tr("! reqhttpCB feedid:",opt.hearders.feedid)
	tr("! reqhttpCB total length",  smt.shortenunit( cl ) )

	if(returnStatus !=200){
		tr(">reqhttpCB returnStatus", returnStatus)
		opt.errSMS= "connection fail: 	>reqhttpCB returnStatus" + returnStatus
		errmail(null,cjb,opt)
	}else{

   		tr("trying to get data .......")
		opt.feedres.setEncoding(cjb.buffercode);
		opt.totalpiece=0
		var chunkcount = 0;
		var returnBody = "";

		opt.feedres.on('data', function(chunk) {
			//tr("opt.feedres.data")
			chunkcount++;
			// returnBody splited to several part during Event:data, so here need to
			// connect all returnBody together
			if (chunkcount % 1000 == 0) {
				tr("> feedres.on data, getting chunk for chunk:" + fid + "-" + chunkcount / 1000 + "... ");
				smt.trmem()
			}

			if(cjb.httpstream!=1) { 
				returnBody = returnBody + chunk;
			}else{
				opt.totalpiece ++
				opt.returnbody = chunk
				callback(cjb, opt);
			}
		});

		opt.feedres.on("end",function() {
			tr("opt.feedres.end")
			if(cjb.httpstream!=1) { 
				// var returnBody = encoding.convert(returnBody,"iso-8859-1","binary");
				// replace returnBody to last returnChildren
				opt.returnbody = cjb.returnChildren[opt.fid] = returnBody;
				returnBody=""
				// tr("feedres.on feedid:",opt.feedid)
				callback(cjb, opt);
			}else{
				tr("!> cjb.httpcount loaded: ",cjb.httpcount, "current fid:",opt.fid)

				cjb.httploaded[opt.fid]=1
				cjb.totalpiece[opt.fid]=opt.totalpiece
				cjb.httpcount=cjb.httpcount+1
				cjb.httploadedEvent.emit("httpallloaded", opt.fid ,opt.totalpiece , cjb.httpcount )
				cjb.curloadedfid=opt.fid
			}
		});
		
	}
};



function usedtime(cjb){
	cjb.endtime=Date.now()
	cjb.usedtime=cjb.endtime - cjb.starttime
	var timestr=secondsToString(cjb.usedtime/1000)
	
	tr("total used time:", timestr)
}



function parsecsv(){}
/*
 * according to data formate , parse feed to JSON object @param{object} cjb ,
 * current job @param{object} opt , opt with detailed params
 * @param{function} callback , a callback
 */
function parsefeed(cjb, opt, callback) {
	tr(">parsefeed is loading parts:", parseInt(opt.partid)+1 , "/" ,  parseInt(opt.totalid)+1)
	// cjbclone must be declared before clone
	// async write to s3 , s3upload(cjb) is in write to File
	// parse CSV
	//usedtime(cjb)

	
	beforeparseCB(cjb, opt);
	
	if (cjb.format == "csv" || cjb.format == "text") {
		var csvopts = {
			comment : cjb.comment,
			delimiter : cjb.delimiter,
			quote : cjb.quote,
			rowdelimiter : cjb.rowdelimiter
		};

		tr(">parsefeed returnBody size:", opt.returnbody.length);
		if(opt.returnbody.length<1000){
			tr("> parsefeed opt.returnbody.length<1000")
			console.log(opt.returnbody)
			//console.log(opt.feedres.statusCode)
		}
		
		if (opt.returnbody == "") opt.returnbody= "emtpy\nemtpy"
		var partid=opt.partid || 0
		var totalid=opt.totalid || 0

		function csvparse(err, result) {
			//smt.trmem()
			tr(">parsefeed loaded parts:", parseInt(partid)+1 , "/" ,  parseInt(totalid)+1)
			//tr(typeof result )
			opt.returnbody=""
			opt.partid =partid
			opt.totalid =totalid
			opt.feedroot = result;
			//tr( JSON.stringify(result) )
			tr("result.length",result.length)
			result=""


			if (!err && opt.feedroot && opt.feedroot[0]  ) {
				// cjb.startline = req.query["startline"] || 1 //2nd line
				// cjb.urlkey = req.query["urlkey"] || 3
				cjb.fieldsorgarr = opt.feedroot[0];
				opt.feedroot = opt.feedroot.slice(cjb.startline,opt.feedroot.length);
				//tr(opt.feedroot)
				if( !opt.feedroot[1] ) {  opt.feedroot[1]  = opt.feedroot[0] }
				afterparseCB(cjb, opt);
				callback(cjb, opt);
			} else {
				tr("! opt.feedroot is not valid ")
				if(err){ opt.err=err }
				else{
				  opt.err={}
				  opt.err.message = "opt.feedroot not well formated"
				}
				opt.errSMS=">parsefeed csv.parse meet error"
				sentErrPage(cjb,opt,callback);
			};
		}
        //csv=""
        //var csv = require('csv');
		// csv.parse(opt.returnbody, csvopts, csvparse );

		function  csv2obj( cjb,opt,callback){
			var err=null
			var result={}
			try{
				result=opt.returnbody.split(cjb.rowdelimiter)
				 for (var r in result){
				 	result[r]=result[r].split(cjb.delimiter)
				 	for(var rr in result[r]){
				 		result[r][rr]=  result[r][rr].replaceAll( cjb.quote , "")
				 	}
				 }
			}catch(e){
				err=e
			}
			callback(err,result)
		}

		csv2obj(cjb,opt, csvparse )
	};

	if (cjb.format == "json") {
		opt.feedroot = JSON.parse(opt.returnbody);
		if (opt.feedroot && opt.feedroot[cjb.rootname]) {
			 opt.feedroot = opt.feedroot[cjb.rootname];
			tr("parsefeed fid " + opt.fid + " has " + opt.feedroot.length + " nodes");
			if(typeof callback == "function" ){callback(cjb, opt);}
		} else {
			var err = new Error("opt.feedroot not well formated")
			opt.errSMS = ">parsefeed meet error"
			opt.err=err
			sentErrPage(cjb,opt,callback);
		}
	}

	if (cjb.format == "xml") {
		xml2jsParse(
				opt.returnbody,
				function(err, result) {
					//tr(opt.returnbody)
					 opt.feedroot = result;
					// cjb.urlkey = cjb.req.query["urlkey"] || "url"
					// cjb.startline = cjb.req.query["startline"] || 0
					if (!err && opt.feedroot && opt.feedroot[cjb.rootname]) {
						opt.feedroot = opt.feedroot[cjb.rootname][cjb.nodename];
						tr("parsefeed fid " + opt.fid + " has "
											+ osize(opt.feedroot)
											+ " nodes");
						afterparseCB(cjb, opt);
						callback(cjb, opt);
					} else {
						if(err){err.message += " and opt.feedroot not well formated"}
						else{
   						  var err = new Error("opt.feedroot not well formated")
						}
						opt.errSMS=err
						opt.err=err
						sentErrPage(cjb,opt,callback);
					}
				});
	};
	//smt.trmem()
};



/*
 * after JSON manipulate, convert the export JSON to original format
 * @param{object} cjb , current job @param{object} opt , opt with detailed
 * params @param{function} callback , a callback
 */

function obj2str(cjb, opt, callback) {
	tr(">>obj2str");
	if (!opt.feedroot){opt.feedroot={}}
	if (!opt.exportObj){opt.exportObj={}}
	try{
			if (cjb.format == "csv" || cjb.format == "text") {
				opt.feedroot = opt.exportObj;
				tr(">obj2str opt.exportObj.length",opt.exportObj.length)
				// opt.feedroot is org source of data, exportObj is
				// modified data
				cjb.fieldsarr = cjb.fieldsarr || cjb.fieldsorgarr;
				//cjb.delimiterext = cjb.csf.delimiterext || cjb.delimiter;
				json2csv({
					data : opt.feedroot,
					fields : cjb.fieldsarr,
					del: cjb.delimiterext
				}, function(err, returnBody) {
					if (err) {
						tr(err);
					}
					//returnBody = returnBody.replace(/\,/g, cjb.delimiter);
					
					opt.feedroot=opt.exportObj=""
					smt.trmem()
					var  repfield='"'+cjb.fieldsarr.toString().replace(/\,/g, '"'+cjb.delimiterext+'"')+'"';
					tr("repfield:",repfield)
					if (cjb.csf.rmfield==1) {
					  //repfieldn= repfield + cjb.rowdelimiterext;
					  returnBody=returnBody.substring( returnBody.indexOf(cjb.rowdelimiterext) + cjb.rowdelimiterext.length )
					} else if (cjb.csf.fieldstr) {
					  returnBody=returnBody.replace(repfield, cjb.csf.fieldstr);
					}

					returnBody = returnBody.replace(/\"/g, cjb.quoteext);
		            
		            if(cjb.csf.additionpart){returnBody=returnBody+cjb.csf.additionpart}
		            // goes to sentToPage, sentOrWrite
		            exportdata(returnBody)
				});
			}

			if (cjb.format == "xml") {
				var arrl = opt.feedroot[cjb.rootname][cjb.nodename].length;
				tr("there are ", arrl, " in obj2str");
				var unit = 1000;
				var numbergroup = Math.ceil(arrl / unit);
				// numbergroup=2;
				var exportBody = "";
				var starttime = Date.now();
				// parse for each unit
				for (var i = 0; i < numbergroup; i++) {
					tr("working on id:", (i + 1), "/", numbergroup, "array group");
					var curarr = opt.feedroot[cjb.rootname][cjb.nodename].slice( 0 + unit * i, unit * (i + 1));
					// var curarr= [].slice.call(opt.feedroot[cjb.rootname], 0+unit*i, unit*(i+1) )
					var returnBody = "";
					returnBody = js2xmlparser(cjb.nodename, curarr);
					// remove header and rootname for each node
					returnBody = returnBody.replace( /\<\?xml version="1.0" encoding="UTF-8"\?\>\n/g, "");
					exportBody += returnBody;
					var endtime = Date.now();
					var difftime = (endtime - starttime) / 1000;
					var avrtime = difftime / (i + 1);
					var resttime = avrtime * (numbergroup - i - 1);

					tr("estimate rest time:", secondsToString(resttime), "sec");
				};

				// create header and rootname
				exportBody = '<?xml version="1.0" encoding="UTF-8"?>\n' + "<" + cjb.rootname + ">" + exportBody + "</" + cjb.rootname + ">";
				
				// goes to ksbgenxml or combineXmlFiles
				exportdata(exportBody)
			}
	}
	catch(err){
		var errtext="Input Json is not avaliable"
		tr(errtext)
		cjb.connectedObj[cjb.requrl]=0
		cjb.res.send(200, 'Sorry, we met error when exporting your data, <br>[Reason]:'+errtext+" <br>[Err code]:"+err);
	}

	function exportdata(data){
		tr("exportdata data.length:",data.length)
		cjb.returnChildrenResult[opt.fid] = data;
		callback(cjb, opt);
	} 
}

/*
 * sent back a Error page @param{object} cjb , current job
 * current job @param{object} opt , opt with detailed params
 */
function sentErrPage(cjb,opt,callback) {
	if (opt.errSMS.indexOf("Stack:")<0  ) opt.errSMS = showfullerror(cjb,opt) 
	opt.returnbody = opt.errSMS
	cjb.format = "text";
	sentToPage(cjb,opt);
	//checkjobdone(cjb,opt)
}


function showfullerror(cjb,opt){
	return   "Custom SMS:  " + opt.errSMS + 
			 "\nClient IP: " + cjb.clientip+ 
			 "\nMessage:   " + opt.err.message  + 
			 "\nType:      " + opt.err.type + 
			 "\nArguments: " + opt.err.arguments +
			 "\nStack:     " + opt.err.stack  
}


/*
 * set a job status to  done
 */
function checkjobdone(cjb,opt,callback){ 
	tr("checkjobdone:", cjb.requrl, " finished :) ")
	

	if(cjb.checkjobdoneFlag !=1){
		cjb.checkjobdoneFlag=1
		usedtime(cjb)
		cjb.connectedObj[cjb.requrl]=0 
		if(!callback) callback=smt.ffn
		if( !cjb.noclean){
				opt=null
				cjb.req=null
				cjb.res=null
				cjb=null
				smt.trmem()
			}
	}

	
}


/*
 * limited each job running at one time
 * conobj is global object var to determin if the job is running
 */
function testConn( req, res , connectedObj , gmv, callback){
	tr(">testConn for url : ", req.url)
	//var reqheader = req.headers 
	var clientip = req.connection.remoteAddress || "unknown IP" ;
	tr(">testConn clientIP: " ,  clientip )
	//smt.tobj(req.headers)

	if(req.query["rest"]){ connectedObj[req.url]=0 }
	if(connectedObj[req.url]!=1){
		tr(">testConn was not working", req.url)
		var cjb = {};
		cjb.gmv=gmv		
		cjb.starttime=Date.now()
		connectedObj[req.url]=1
		cjb.connectedObj=connectedObj
		cjb.req=req
		cjb.clientip=clientip
		cjb.requrl=req.url
		cjb.res=res
		cjb.transMethod = req.url.split("/")[2];
		callback(cjb)
	} else { 
		tr("......... server is running")
		res.send( "job: "+ req.url + " is running in another session" );
	}
}


/*
 * sent a html page back to cjb.res @param{object} cjb , current job
 */
function sentToPage(cjb, opt, callback) {
	tr("> start sent to page");
	
	if(cjb.sentToPageFlag !=1){
		cjb.sentToPageFlag=1
		try{
			cjb.res.send(cjb.requrl + " Job finished at: "+ smt.gettime());
		}catch(err){
			tr("sentToPage meet eror",err)
		}	
		if(typeof callback !="function") {
				tr(callback)
				callback=smt.ffn
		}

		callback(cjb,opt)
	}
};



/*
 * acoording to cjb.direct to choose wehter save a local copy @param{object} cjb ,
 * current job
 */
function sentOrWrite(cjb,opt, callback) {
	tr("> start sentOrWrite");
	cjb.direct ? awss3.s3uploadDirect(cjb,opt,callback) : writetoFile(cjb, opt, awss3.s3upload);
}

/*
 * save data in cjb in a localfile @param{obj} cjb , current job object
 * @param{function} callback , a callback
 */
function writetoFile(cjb, opt, callback) {
	tr("> start writetoFile");
	
	var pathfilename = opt.pathfilename || cjb.pathfilename 
	var trigger = opt.trigger || "notrigger"
	var s3name= opt.s3name || cjb.s3name
	var s3keypath= opt.s3keypath || cjb.s3keypath

	creatfolder( pathfilename.substring(0, pathfilename.lastIndexOf("/"))  ); 

	var writeFileCB = function (err) {
		opt.trigger=trigger
		opt.pathfilename=pathfilename
		opt.s3name=s3name
		opt.s3keypath=s3keypath

		if (err) {
			tr("save file meet error:", err);
		} else {
			var stats = fs.statSync(pathfilename);
			var fileSizeInBytes = cjb.fileSizeInBytes = stats["size"];
			
			tr(200, 'writetoFile : a File Saved', smt.uppath() + pathfilename.substr(2) ,"size is ", smt.shortenunit(fileSizeInBytes) );
			callback(cjb , opt );
			//awss3.s3upload(cjb, opt, cllback)
		};
	}
	fs.writeFile(pathfilename , opt.returnbody, writeFileCB );
};	


/*
 * compress writed file
 */
function gzipfile(cjb, opt, callback) {
	var pathfilename = opt.pathfilename || cjb.pathfilename 
	var gzpathfilename=pathfilename+".gz"
	 var inp = fs.createReadStream(  pathfilename );
	 var out = fs.createWriteStream( gzpathfilename );
	 inp.pipe(gzip).pipe(out).on("close", function(){
		var stats = fs.statSync(gzpathfilename);
		var fileSizeInBytes = stats["size"];

		console.log( smt.shortenunit( fileSizeInBytes) )
		pathfilename = opt.pathfilename = cjb.pathfilename =gzpathfilename
		callback( cjb , opt );
	});
}


/*
 * download pictures to localfolder @param{obj} cjb , current job object
 */
function fetchPic(cjb, opt,callback) {
	var picArray = [];
	var picPathArray = [];

	for ( var i in opt.feedroot) {
		picArray[i] = String(opt.feedroot[i]["productImg"]).replace(/\t/g, "").replace(/\n/g, "").replace(/\r/g, "");
		var sentHost = picArray[i].match(/:\/\/[^\/]*(?=\/)/).toString().substring(3);
		picPathArray[i] = picArray[i].substring(picArray[i].indexOf(sentHost) + sentHost.length + 1);

		var pathfilename = cjb.jobpath + picPathArray[i];
		var cjbclone = clone(cjb);
		cjbclone.pathfilename = pathfilename;
		cjbclone.localname = picPathArray[i];
		cjbclone.contenttype = "image/jpeg";
		creatfolder(cjb.jobpath + picPathArray[i].substring(0, picPathArray[i].lastIndexOf("/")));
		downreq(picArray[i], pathfilename, cjbclone, sentOrWrite);
	};
};


function setreturnbody(cjb,opt,callback)
{
	tr("setreturnbody");
	opt.returnbody=cjb.returnChildrenResult[opt.fid];
	callback(cjb,opt);
}
/*
 * depents on account run a set of code before parsed @param{object} cjb ,
 * current job
 */
function beforeparseCB(cjb) {
	if (cjb.customerCode == "HA1RS") {
		opt.returnbody = opt.returnbody.replace(/(<br>)?\s?<font color=#[\w\d]*>\s?(<br>)?(<b>)?\s?[¦\:\-\w\d\s\.\!,\?\|\/]*(<\/b>)?(<\/font>)?/g,"");
		opt.returnbody = opt.returnbody.replace(/#/g, "");
	}
}

/*
 * depents on account run a set of code after parsed @param{object} cjb ,
 * current job
 */
function afterparseCB(cjb) {
	if (cjb.customerCode == "HA1RS") {
	}
}


/*
 * sent folder to a SFTP server
 * current job opt callback
 */
function sentToftp(cjb, opt, callback){
  tr("sentoftp");
  var c = new ftpClient();
  c.on('ready', function() {
    c.put(cjb.pathfilename, cjb.pathfilename, function(err) {
      if (err) {
      	 console.log(err);
      	}
      c.end();
      callback(cjb, opt);
    });
  });

  c.on('greeting', function(msg) {  console.log("response: "+msg); });
  c.on('end', function() {  console.log("Connection End"); });
  c.on('error', function( err) {  console.log(err); });
  c.on('close', function( cls) { console.log(cls); });
  // connect to localhost:21 as anonymous
  var ftpopt= { 
  				"user" : cjb.csf.ftpuser,
  				"password" : cjb.csf.ftppassword ,
  				"host" : cjb.csf.ftphost ,
  				"port" : cjb.csf.ftpport,
  				"secure" : true
  			};
  smt.tobj(ftpopt);
  c.connect(ftpopt);
 }

function finishemail(cjb, opt, callback){
	cjb.emailstr = opt.emailstr = opt.emailstr ||  "following task is finished successfuly:"+ cjb.requrl
    cjb.emailhtml = opt.emailhtml = opt.emailhtml || ""
    opt.mailPrefix = opt.mailPrefix = opt.mailPrefix || "a task finished! :" + cjb.requrl
    sentToAddress =  opt.sentToAddress = opt.sentToAddress || cjb.csf.sentToAddress || "zd@mojn.com"
    sentToSubject =  opt.sentToSubject = opt.sentToSubject || "[feed transformer task finished]"
	emailpack.sentTagsEmail(cjb,opt)
	callback(cjb,opt)
}


function wrapconnCB(cjb) {
			var opt={};

			try{	// define common cjb content
					definecjb(cjb);
					tr("cjb.transMethod: ",cjb.transMethod)
					var met=cjb.gmv[cjb.transMethod]
					var runlist= met.runlist || met.getlist(cjb)
					tr( "getlist is ", runlist.length)
					// convert all fun to obj
					var funcObjArr=[]
					tr("converting functions to object...")
					for (var f=0 ; f<runlist.length ; f++ )
					{
						var newobj = new smt.func2obj(runlist[f] )
						funcObjArr.push( newobj )
					};
					tr("setcallbacks...")
					// set callback on by one
					smt.runcbs(funcObjArr)
					cjb.funcObjArr=funcObjArr
					// run the first function
					funcObjArr[0].run(cjb, {});
				}
			catch(err){
				opt.errSMS= "!starter wrap meet error in "+ cjb.requrl;
				errmail(err,cjb,opt)
			}					
	}

exports.finishemail=finishemail
exports.wrapconnCB=wrapconnCB
exports.errmail=errmail;
exports.gzipfile=gzipfile;
exports.testConn=testConn;
exports.checkjobdone=checkjobdone;
exports.sentToftp=sentToftp;
exports.setreturnbody=setreturnbody;
exports.sentOrWrite=sentOrWrite;
exports.beforeparseCB=beforeparseCB;
exports.afterparseCB=afterparseCB;
exports.fetchPic=fetchPic;
exports.writetoFile=writetoFile;
exports.creatfolder=creatfolder;
exports.sentToPage=sentToPage;
exports.sentErrPage=sentErrPage;
exports.parsefeed=parsefeed;
exports.httprequest=httprequest;
exports.fetchfeed=fetchfeed;
exports.reqhttpCB=reqhttpCB;
exports.definecjb=definecjb;
exports.obj2str=obj2str;
