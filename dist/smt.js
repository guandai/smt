/*! smt - v0.0.1 - 2015-06-14
* Copyright (c) 2015 twindai; Licensed  */
// "use strict";

// Establish the root object, `window` in the browser, or `global` on the server.
var root = this;

// Create a refeence to this
var smt = {};
var isNode = false;



// Export the smt object for **CommonJS**, with backwards-compatibility
// for the old `require()` API. If we're not in CommonJS, add `smt` to the
// global object.
if (typeof module !== "undefined" && module.exports) {
    module.exports = smt;
    root.smt = smt;
    isNode = true;
    console.log("Run Node mode");
} else {
    root.smt = smt;
    console.log("Run browser mode");
}


if (isNode) {
    var http = require("http");
    var winston = require("winston");
    var util = require("util");
    var mkpath = require("mkpath");
    var logger = new(winston.Logger)({
        transports: [
            new(winston.transports.Console)(),
            new(winston.transports.File)({
                filename: "log/serverlog.log"
            })
        ]
    });
}



/*
 * wrapper of console.log()
 */
var smtc = smt.tc = function() {
    console.log( arguments ) ;
};



/*
 * create folder by a given path and setp 0777 access @param{obj} cjb , current
 * job object
 */
smt.creatfolder = function(folderstr) {
    mkpath(folderstr, function(err) {
        if (err) {
            if (err.toString().indexOf("EEXIST") >= 0) {
                //  smt.tr("! Folder is exist " + err);
            }
            return false;
        } else {
            //smt.tr("# FOLDER: " + folderstr + " created");
            mkpath.sync(folderstr, 777);
        }
    });
};



/*
 * trace conten with logger
 */

var smtr = smt.tr = function() {
    var allstr = "";
    for (var i in arguments) {
        allstr += arguments[i] + " ";
    }

    if (isNode) {
        logger.log("info", allstr);
    } else {
        smtc(allstr);
    }
};




/*
 *  convert obj to regular exp.   expect obj is list of string 
 *  @param{obj} org obj   , 
 *  @return{regexp}          ,  
 */
smt.obj2reg = function(obj) {
    var reg = "";
    for (var o in obj) {
        reg += obj[o] + "|";
    }
    reg = new RegExp(reg.slice(0, -1));

    return reg;
};



/*
 * replace by peer in allsettings
 */

smt.replacepeer = function(replace_peer, str) {
    //var result=str.toString()

    var replace_peer_regex = smt.obj2reg(Object.keys(replace_peer).map(function(str) {
        return str.splice(0, "\\").splice(-1, "\\");
    }));
    //tr(replace_peer_regex)
    while (replace_peer_regex.test(str)) {
        for (var r in replace_peer) {
            str = str.replaceAll(r, replace_peer[r]);
        }
    }
    return str;
};




/*
 * util.ispect a object
 */
smt.tru = function(obj, dep, show) {
    //for (var i in arguments){
    tr(util.inspect(obj, {
        showHidden: show,
        depth: dep
    }));
    //}
};


/*
 * replace html entities to text
 */
smt.tranHtml2Txt = function(str) {
    return str.replaceall("&amp;", "&")
        .replaceall("&quot;", "\"")
        .replaceall("&gt;", ">")
        .replaceall("&lt;", "<")
        .replaceall("&#39;", "'")
        .replaceall("&#248;", "ø")
        .replaceall("&#229;", "å")
        .replaceall("&#230;", "æ");
};


/*
 * console.log wrapper
 */
smt.trl = function() {
    //var allstr="";
    for (var i in arguments) {
        smt.tr(arguments[i]);
        //  allstr+= arguments[i] + " " ;
    }
};





/*
 *  fill 0 in front of  digits by assigned digits number
 */
smt.cutdec = function(str, digits) {
    if (!digits) {
        digits = 2;
    }
    str = str.toString();
    var pos = str.indexOf(".");
    str = str.substring(0, pos + digits);
    return str;
};







/*
 *  show size in mb gb
 * params
 */
smt.shortenunit = function(num) {

    if (typeof num !== "number") {
        num = parseInt(num);
    }
    if (num > Math.pow(1024, 1) && num < Math.pow(1024, 2)) {
        return smt.cutdec(num / Math.pow(1024, 1), 2).toString() + " KB";
    }
    if (num > Math.pow(1024, 2) && num < Math.pow(1024, 3)) {
        return smt.cutdec(num / Math.pow(1024, 2), 2).toString() + " MB";
    }
    if (num > Math.pow(1024, 3) && num < Math.pow(1024, 4)) {
        return smt.cutdec(num / Math.pow(1024, 3), 2).toString() + " GB";
    }
    return num;
};




/*
 * show process memoryuse
 */
smt.trmem = function() {
    var pmem = process.memoryUsage();
    for (var i in pmem) {
        pmem[i] = smt.shortenunit(pmem[i]);
    }
    smt.tr("----Memory:", util.inspect(pmem), "------");
};



/*
 * show each content in object seperately 
 */
// smt.trn = function(obj) {
//     var objname = arguments.callee.caller;
//     console.log(objname);
//     for (var i in arguments) {
//         console.log(objname, obj);
//             //  allstr+= arguments[i] + " " ;
//     }
// };





/*
 * find an object  size / length
 * @param{objet} obj          , current job
 * @return{int} count         , a size number in byte
 */
smt.osize = function(obj) {
    var count = 0;
    for (var i in obj) {
        i = i;
        count++;
    }
    return count;
};



/*
 * compare if a array in anoterh array, if A in B
 * @param{array} arra         ,  A array 
 * @param{array} arrb         ,  B array 
 * @return{boolean} result    , in or not in
 */
smt.arrainbtest = function(arra, arrb) {
    var testf = true;
    var sizea = smt.osize(arra);
    var count = 0;
    for (var a in arra) {
        for (var b in arrb) {
            if (arra[a] === arrb[b]) {
                count++;
                break;
            }
        }
    }
    if (count !== sizea) {
        testf = false;
    }

    //console.log(arra,arrb);
    //console.log(testf);
    //console.log(count);
    return testf;
};



/*
 * create array  which only A have plus which only B have
 * @param{array} arra         ,  A array 
 * @param{array} arrb         ,  B array 
 * @return{array} arrd    ,  A  B different parts
 */
smt.arradiffb = function(arra, arrb) {
    var testaeqb = false;
    var arrd = [];
    // var  arragt=[]
    // var  arrbgt=[]
    // var  arrbin=[]

    for (var ia in arra) {

        for (var b in arrb) {
            if (arra[ia] === arrb[b]) {
                testaeqb = true;
                //      arrbin.push(arra[a])
            }
        }
        if (testaeqb === false) {
            //  arrgt.push(arrb[a])     
            arrd.push(arra[ia]);
        }
    }

    for (var ib in arrb) {
        for (var abi in arrb) {
            if (arrb[ib] === arrb[abi]) {
                testaeqb = true;
            }
        }
        if (testaeqb === false) {
            //  arrbgt.push(arrb[b])
            arrd.push(arrb[ib]);
        }
    }
    return arrd;
};



/*
 * create array  which only A cross with B 
 * @param{array} arra         ,  A array 
 * @param{array} arrb         ,  B array 
 * @return{array} arrd    ,  A  B same parts
 */
smt.arraoverb = function(arra, arrb) {
    // var  arragt=[]
    // var  arrbgt=[]
    var arrbin = {};
    for (var a in arra) {
        for (var b in arrb) {
            if (arra[a] === arrb[b]) {
                arrbin[a]=arra[a];
            }
        }
    }
   
    return arrbin;
};




/*
 * create array  which A more than B
 * @param{array} arra         ,  A array 
 * @param{array} arrb         ,  B array 
 * @return{array} arrm    ,  A more than B
 */
smt.arragtb = function(arra, arrb) {
    var arrm = [];
    var testeach = false;
    for (var a in arra) {

        for (var b in arrb) {
            if (arra[a] === arrb[b]) {
                testeach = true;
            }
        }
        if (testeach === false) {
            arrm.push(arra[a]);
        }
    }
    return arrm;
};



/*
 * clone an object  another version
 * @param{object} obj         , current job
 */
smt.cloneobj = function(obj1) {
    var extend = util._extend;
    var obj2 = extend({}, obj1);
    return obj2;
};



/*
 * clone an object
 * @param{object} obj         , current job
 */
smt.clone = function(obj) {
    if (obj === null || "object" !== typeof obj) {
        return obj;
    }
    var copy = obj.constructor();
    for (var attr in obj) {
        if (obj.hasOwnProperty(attr)) {
            copy[attr] = obj[attr];
        }
    }
    return copy;
};



/*
 *  convert obj to arr.
 *  @param{obj} org obj   , 
 *  @return{array}          ,  
 */
smt.obj2arr = function(obj) {
    var arr = [];
    for (var o in obj) {
        arr.push(obj[o]);
    }
    return arr;

};





/*
 *  change seconts to higher time unit.
 * @param{number} seconds       , original text to be cutyed
 * @return{String}          ,  a combination text of hour  minutes and seconds
 */
smt.secondsToString = function(seconds) {
    if (!seconds) {
        seconds = 0;
    }
    //var numyears = Math.floor(seconds / 31536000);
    //var numdays = Math.floor((seconds % 31536000) / 86400);
    var numhours = Math.floor(((seconds % 31536000) % 86400) / 3600);
    var numminutes = Math.floor((((seconds % 31536000) % 86400) % 3600) / 60);
    var numseconds = Math.floor((((seconds % 31536000) % 86400) % 3600) % 60);
    return numhours + " h " + numminutes + " m " + numseconds + " s";

};




/*
 * trace 1st level content in an object
 * @param{objet} obj          , current job 
 */
smt.tobj = function(inobject, varname, end) {

    if (typeof inobject === "string") {
        smt.tr(inobject);
    } else {
        varname = varname || "noNameObj";
        var inlength = 0;
        for (var c in inobject) {
            c = c;
            inlength++;
        }
        smt.tr("there are " + inlength + " objects in " + varname);
        end = end || inlength;

        var count = 0;
        for (var j in inobject) {
            j = j;
            count++;
            if (end >= count) {
                smt.tr("tobj " + varname + ": " + j + ": " + inobject[j]);
            }
        }
    }
};



/*
 * do something useful for buffers  when loading a uri
 * @param{string} str         , a input str need to be translate
 * @param{object} dictobj     , a object include map as a dict
 * @return{string} str        ,  return the translated str 
 */

smt.translatestr = function(str, dictobj) {
    for (var d in dictobj) {
        str = str.replace(d, dictobj[d]);
    }
    return str;
};




/*
 * join several obj and convert to array
 * @param{array} orgarr   ,  multipal array can be used as params, which need to be join togething
 * @return{array} newarr  ,   join several obj and convert to array 
 */
smt.joinAsArray = function(orgarr) {
    // get first array as target array
    var newarr = [];
    for (var o in orgarr) {
        newarr.push(orgarr[o]);
    }
    // get rest arrays
    var extarr = [].slice.call(arguments, 1); // choose all additional args , Array.prototype.slice.call(arguments,1)
    for (var e in extarr) {
        for (var key in extarr[e]) {
            newarr.push(extarr[e][key]);
        }
    }
    return newarr;
};





smt.func2obj = function(infunc) {
    //initial args
    return {
        cjb: {},
        opt: {
            id: 0
        },
        firstline: infunc.toString().match(/function.*/)[0],
        funname: infunc.toString().match(/function.*/)[0].match(/\s.*?\s?(?=\()/)[0].match(/\S+/)[0],
        run: function() {
            var its = this;
            var lastargs = arguments.length - 1;
            var opt = arguments[lastargs];
            its.startpart(opt.id);
            var newargs = smt.joinAsArray(arguments, [its.callbacks]);
            infunc.apply(its, newargs);
        },
        // callbacks arguments is assigned in real functions, normally it is callback(cjb, opt) ,  callback.apply(this, [].slice.call(arguments,  0, arguments.length-2)
        callbacks: function() {
            // when call a callback in a function, the last param should always be a opt object
            var its = this;
            var id = arguments[arguments.length - 1].fid;
            its.endpart(id);
            if (its.callback) {
                if (typeof its.callback === "function") {
                    its.callback = [its.callback];
                }
                //tr(">"+ funname + " has "+ callback.length +" callbacks")
                for (var f in its.callback) {
                    //tr("> Start ", (parseInt(f)+1) , "/" , callback.length , " callbacks of" , funname ,"] for task id", id ," :\n")
                    if (typeof its.callback[f] !== "function") {
                        smt.tr("No callback need to run !");
                    } else {
                        its.callback[f].apply(this, arguments);
                    }
                }
            } else {
                //smt.tr("All callbacks finished!  task id: " + id + "\n")
            }
        },
        // log initialing a input function
        startpart: function(id) {
            smt.tr(">>SSS Start of [", this.funname, "] for task id", id);
        },
        endpart: function(id) {
            smt.tr(">>EEE   End of [", this.funname, "] for task id", id, ", and start callback...\n");
        }
    };
};



/*
 * common use for put err in option for cb refer
 * @param{option} object for current running process o refer
 * @param{err}   err we focusing on 
 * @return{option} 
 */
smt.assignErr = function(option, err, callback) {
    option.err = err;
    smt.tr(err, err.stack); // an error occurred
    if (callback) {
        callback(option);
    }
    return option;
};






/*
 * add params for a callback
 * @param{function} infunc   ,  original callback function
 * @attribute{int} length   ,  the expected length
 * @return{string} str  ,  return result string 
 */
smt.makecb = function(infunc) {
    var restargs = [];
    for (var a = 1; a < arguments.length; a++) {
        restargs.push(arguments[a]);
    }
    //console.log("customized arguments:",restargs)
    var appcb = function() {
        //console.log("inherit arguments:",arguments)
        var newargs = [];
        for (var arg in arguments) {
            newargs.push(arguments[arg]);
        }
        newargs = newargs.concat(restargs);
        //  console.log("new arguments:",newargs)
        infunc.apply(null, newargs);
    };
    return appcb;
};




/*
 * copy appendObj data to orgObj, if the same , 
 * appendObjs content will overwrite orgobj content
 * @param{object} orgObj   ,  original object
 * @attribute{object} appendObj   ,  the  addon object
 * @return{object} orgObj  ,  return result object
 */
smt.mergeobj = function(orgObj, appendObj) {
    for (var o in appendObj) {
        orgObj[o] = appendObj[o];
    }
    return orgObj;
};





/*
 * convert a string to expect length 
 * @param{mix} str   ,  a number or string need to be adept 
 * @attribute{int} length   ,  the expected length
 * @return{string} str  ,  return result string 
 */
smt.tolen = function(str, length) {
    str = str.toString();
    if (str.length < length) {
        str = "0" + str;
        smt.tolen(str, length);
    }
    if (str.length > length) {
        str = str.substring(1);
        smt.tolen(str, length);
    }
    return str;
};



/*
 * get the max number in an array 
 * @param{Array} numArray   ,  a number or string need to be adept 
 * @return{Int} return  ,  return max of result number
 */
smt.getMaxOfArray = function(numArray) {
    return Math.max.apply(null, numArray);
};





/*
 *  fill 0 in front of  digits by assigned digits number
 */
smt.filldigits = function(str, digits) {
    if (!digits) {
        digits = 2;
    }
    str = str.toString();
    while (str.length < digits) {
        str = "0" + str;
    }
    return str;
};



/*
 *  return a yy+"_"+mm+"_"+dd+"_"+hh+"_"+mi+"_"+ss  string
 */
smt.gettime = function(cut) {

    var ms = new Date();
    var yy = ms.getYear().toString().substring(1);
    var mm = smt.filldigits(ms.getMonth() + 1, 2);
    var dd = smt.filldigits(ms.getDate(), 2);

    var hh = smt.filldigits(ms.getHours(), 2);
    var mi = smt.filldigits(ms.getMinutes(), 2);
    var ss = smt.filldigits(ms.getSeconds(), 2);
    var result = yy + mm + dd + "-" + hh + mi + ss;
    if (!cut) {
        cut = result.length;
    }
    return result.substring(0, cut);
};






/*
 *  get parent path, return string
 */
smt.uppath = function() {
    var workpath = process.cwd();
    return workpath.substring(0, workpath.lastIndexOf("/"));
};



/*
 *  get parent path, return string
 */
String.prototype.replaceall = function(search, tostr) {
    return this.split(search).join(tostr);
};



/*
 * insert char in a string
 */
String.prototype.splice = function(idx, rem, s) {
    if (typeof rem === "string") {
        s = rem;
        rem = 0;
    }
    return (this.slice(0, idx) + s + this.slice(idx + Math.abs(rem)));
};




/*
 * object slice
 */
Object.prototype.slice = function(s, e) {
    if (!e) {
        e = smt.osize(e);
    }
    var c = 0;
    for (var i in this) {
        if (c < s || c > e) {
            delete this[i];
        }
        c++;
    }
    return this;
};
Object.defineProperty(Object.prototype, "slice", {
    enumerable: false
});




/*
 * replaceAll for string
 */
String.prototype.replaceAll = function(search, tostr) {
    return this.split(search).join(tostr);
};




/*
 *  get class name of a object
 */
smt.getname = function(Object) {
    var funcNameRegex = /smt. = function(.{1,})\(/;
    var results = (funcNameRegex).exec((Object).constructor.toString());
    return (results && results.length > 1) ? results[1] : "";
};




/*
 * print task finished]
 */

smt.finishfn = function() {
    smt.tr("Task finished");
};







/*
 * show a object memory use
 *  @param{object} object   ,  show mem use of this param
 */
smt.trobjmem = function(object) {
    var objectList = [];
    var stack = [object];
    var bytes = 0;
    while (stack.length) {
        var value = stack.pop();
        if (typeof value === "boolean") {
            bytes += 4;
        } else if (typeof value === "string") {
            bytes += value.length * 2;
        } else if (typeof value === "number") {
            bytes += 8;
        } else if (typeof value === "object" && objectList.indexOf(value) === -1) {
            objectList.push(value);
            for (var i in value) {
                stack.push(value[i]);
            }
        }
    }
    smt.tr(smt.shortenunit(parseInt(bytes)));
    return bytes;
};




/*
 *  http request reaturn full body
 */
smt.httpfullbody = function(opt) {
    opt.sentHost = opt.sentHost || "127.0.0.1";
    opt.sentPort = opt.sentPort || 80;
    opt.sentPath = opt.sentPath || "/";
    opt.sentMethod = opt.sentMethod || "GET";
    opt.callback = opt.callback || null;
    opt.jsonpcallback = opt.jsonpcallback || null;
    opt.sentQuery = opt.sentQuery || "";
    smt.tc(opt.callback);
    var reqopt = {
        hostname: opt.sentHost,
        port: opt.sentPort,
        path: opt.sentPath,
        method: opt.sentMethod,
    };

    var proxyreq = http.request(reqopt, function(proxyres) {
        var returnStatus = proxyres.statusCode;
        var returnHeaders = JSON.stringify(proxyres.headers);
        smt.tr("STATUS: " + returnStatus);
        smt.tr("HEADERS: " + returnHeaders);
        proxyres.setEncoding("utf8");
        var returnBody = "";
        proxyres.on("data", function(chunk) {
            returnBody = returnBody + chunk;
        });
        proxyres.on("end", function() {
            var resBody = returnBody;
            if (opt.jsonpcallback) {
                resBody = opt.jsonpcallback + "(" + resBody + ")";
            }
            opt.callback(resBody);
        });
    });

    proxyreq.on("error", function(e) {
        smt.tr("problem with request: " + e.message);
    });
    if (opt.sentQuery) {
        proxyreq.write(opt.sentQuery);
    }
    proxyreq.end();
};






/*
 * run a serial of callbackk in an array , each cb has .run method.
 * this need to be runing with func2Obj to impliment a sync process
 * @param{funcArr} Array with str   ,  a number or string of function name
 * @return{null} 
 */
smt.runcbs = function(funcArr) {
    for (var f = 1; f < funcArr.length; f++) {
        var setflag = 0;
        var funcObj = {}; //  a temp obj to store callback obj of next function 
        if (!(funcArr[f] instanceof Array)) {
            funcArr[f] = [funcArr[f]];
        }
        for (var r in funcArr[f]) {
            if (typeof funcArr[f][r].run === "function") {
                // set a temp or current child in child
                funcObj = funcArr[f][r];
                // overwirte current to its own run 
                funcArr[f][r] = funcArr[f][r].run;
                setflag = 1;
            }
        }
        funcArr[f - 1].callback = funcArr[f];
        // set current object  to the lastest in funcArr[f] which has run
        if (setflag === 1) {
            funcArr[f] = funcObj;
        }
    }
};



/*
 * run in serials
 */
smt.runcbsfn = function(funcArr) {
    var funcObjArr = [];
    for (var f = 0; f < funcArr.length - 1; f++) {
        //tr(f)
        //tr(funcArr[f])
        var newobj = new smt.func2obj(funcArr[f]);
        funcObjArr.push(newobj);
    }
    smt.tr(funcObjArr.length);
    smt.runcbs(funcObjArr);
    return funcObjArr;
};




if (isNode) {
    smt.creatfolder("log");
    //    module.exports = exports;
}
