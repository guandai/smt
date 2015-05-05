// aws prepare
var AWS = require('aws-sdk');
var fs = require('fs');
var smt = require('./smt');
var tr = smt.tr;
var trace = smt.tr;
var sharepart= require('./sharepart')
AWS.config.loadFromPath('../settings/s3credentials.json');
AWS.config.update({
	region : 'eu-west-1'
});
var s3 = new AWS.S3();
var s3PutBucketDefault = "realtime-targeting";
var s3BaseDefault = s3PutBucketDefault + ".s3.amazonaws.com";
var tagdomain = "https://" + s3BaseDefault + "/";
var sentToAddress = "webmaster@realtime-targeting.com";
var sentToSubject = "Img Tag Report.";


/*
 * directly put data to s3 : opt.returnbody @param{obj} cjb , current job object
 * current job object, opt, callback
 */
function s3uploadDirect(cjb,opt,callback) {
	// use local var would cross use REM
	tr("s3uploadDirect start..");
	cjb.fileSizeInBytes = opt.returnbody.length;

	var s3putbucket= cjb.s3putbucket || s3PutBucketDefault;
	var s3base = cjb.s3base || s3BaseDefault;
 	// define s3 object
 	cjb.s3keypath = opt.s3keypath || cjb.s3keypath
 	cjb.s3name = opt.s3name || cjb.s3name;

	var s3key = cjb.s3keypath + cjb.s3name;
	var s3data = {
		Bucket : s3putbucket,
		Key : s3key,
		Body : opt.returnbody,
		CacheControl : 'max-age=300',
		ACL : 'public-read',
		ContentType : cjb.contenttype
	};
	s3.putObject(s3data, function(err, data) {
		if (err) {
			return tr(err);
			sharepart.errmail(err,cjb,opt)
		} else {
			tr("Successfully uploaded data as: \n" + s3base + "/" + s3key
					+ "\n>file size is " +  smt.shortenunit(cjb.fileSizeInBytes));
			if(callback){callback(cjb, opt);};
		};
	});
};

/*
 * upload data to s3 from a local file : cjb.pathfilename @param{obj} cjb ,
 * current job object, opt, callback
 */
function s3upload(cjb, opt, callback) {
	tr("s3upload start..");
	tr("opt.s3name",opt.s3name)
	var pathfilename = opt.pathfilename || cjb.pathfilename
	var s3name = opt.s3name || cjb.s3name;
	var s3keypath = opt.s3keypath || cjb.s3keypath;
	var s3key = opt.s3key || s3keypath + s3name;
	// use local var would cross use REM
	var fileSizeInBytes = cjb.fileSizeInBytes = fs.statSync(pathfilename)["size"];
	
	var s3uploadCB = function (err, filedata) {
		opt.s3name = s3name 
		opt.s3key  = s3key  
		opt.s3keypath = s3keypath 

		if (err) {
			tr("readFile meet error:" + err);
			sharepart.errmail(err,cjb,opt)
		} else {

			// define s3 object
			var s3putbucket= cjb.s3putbucket || s3PutBucketDefault;
		    var s3base = cjb.s3base || s3BaseDefault;
		
			var s3data = {
				Bucket : s3putbucket,
				Key : opt.s3key,
				Body : filedata,
				CacheControl : 'max-age=300',
				ACL : 'public-read',
				ContentType : cjb.contenttype
			};
			s3.putObject(s3data, function(err, data) {
				if (err) {
					return tr(err);
					sharepart.errmail(err,cjb,opt)
				} else {
					tr("Successfully uploaded data as: " + s3base + "/" + s3key
							+ "\n>file size is " +  smt.shortenunit(cjb.fileSizeInBytes));
					
					if(typeof callback == "function"){
						callback(cjb, opt);
					};
				};
			});
		}	
	}
	fs.readFile( pathfilename, s3uploadCB );
};


/*
 * a wrapper of S3getobject with parameters
 * current job object, opt, callback
 */

function getobject(cjb, opt, callback){
	tr(">getobject");
	var newopt = {}
	for (var o in opt){ 
		newopt[o]=opt[o] 
		//tr("o",o,newopt[o] )
	}
	var curkey = cjb.s3getkey = cjb.gets3keys[opt.fid] || cjb.s3getkey;
	var curpath = opt.pathfilename || cjb.pathfilename
	var s3name = opt.s3name ||cjb.s3name;
	tr("getobject cjb.s3getkey",cjb.s3getkey);
	
	//var cursectime = opt.cursectime || "def_sectime"
	
	var madeS3cb= function (err ,data )
						  {
					 		tr("getobject setbody opt.fid: ",newopt.fid);
				 	 		if (err){ 
				 	 			console.log("! getobject has error:",err); 
				 	 			opt.s3err=err
				 	 			sharepart.errmail(err,cjb,opt)
				 	 			callback(cjb, opt); 
				 	 		} else{ 
				 	 			for (var n in newopt){ 
				 	 				opt[n]=newopt[n] ;
				 	 				//tr("n",n,opt[n])
				 	 			}
					 	 		opt.returnbody = data.Body;
					 	 		data.Body=""
					 	 		opt.pathfilename=curpath
					 	 		opt.curkey=curkey
					 	 		opt.s3name=s3name;
					 	 		smt.trmem()
					 	 		callback(cjb, opt); 
				 	 		};
				 	 		//  console.log(data.Body.toString("utf8"));   // successful response		
						 }
	tr("getting key:",curkey)
	tr("from bucket:",cjb.s3getbucket)
	s3.getObject(  {Bucket: cjb.s3getbucket,
						   Key: curkey} , 
						   madeS3cb
		            );
};


/*
 * a wrapper of S3listObjects with parameters
 * current job object, opt, callback
 */
function listobjects(cjb, opt, callback){
	cjb.s3listfolder = opt.s3listfolder || cjb.s3listfolder;
	if(!opt.NextMarker) opt.NextMarker=""
	var params = {
		  Bucket: cjb.s3getbucket, 
		  Delimiter: ',',
		  MaxKeys: 1000,
		  Marker: opt.NextMarker,
		  Prefix: cjb.s3listfolder
		};
	keyarray=[];
	s3.listObjects(params, function(err, data) {
			 	
		  if (err) {
		  	console.log(err, err.stack); // an error occurred
		  	sharepart.errmail(err,cjb,opt)
		  }
		  else     {
		 	console.log("find files:", smt.shortenunit(data.Contents.length) );
		 	for (var c in data.Contents ){
		 		keyarray.push(data.Contents[c].Key);
		 	};
		 	
		 	if(!cjb.keyarray) cjb.keyarray=[]
		 	cjb.keyarray= cjb.keyarray.concat(keyarray);
		 	
		 	if(data.IsTruncated){
		 		opt.NextMarker=data.NextMarker
		 		listobjects(cjb,opt,callback)
		 	}else{
		 		callback(cjb, opt);
		 	}
		  };
		});
};


exports.listobjects=listobjects;
exports.getobject=getobject;
exports.s3upload=s3upload;
exports.s3uploadDirect=s3uploadDirect;