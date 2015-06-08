var  smt = require('../src/smt');
var mkpath = require("mkpath");
var fs = require("fs");
var util = require("util");
mkpath("test",function(err){
	if(err){
		 throw (err);
	} else {
		fs.exists(path, function(exists){
			util.debug(exists ? "folder created" : "not  create!");
		});
	}
});
//smt.tc(111,222,"444")
var a={a:1,b:2};
//console.log(smt)
console.log(smt);
//smt.tobj(a)
smt.tr(a);


