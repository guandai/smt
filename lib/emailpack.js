var nodemailer = require("nodemailer");
var fs = require('fs');
var smt = require("./smt");
var transporter = nodemailer.createTransport({
    service:"Gmail",
    auth : {
        user: "rrttesting@gmail.com",
        pass: "real1234"
    },
    SMTP: {
        host: "smtp.gmail.com", // hostname 
        secureConnection: true, // use SSL
        port: 465, // port for secure SMTP
        auth: {
            user: "rrttesting@gmail.com",
            pass: "real1234"
         }
     }
    //host: "asmtp.unoeuro.com", // hostname 
     //port: 469, // port for secure SMTP
     //secureConnection: true, // use SSL
     //auth: {
       // user: "webmaster@realtime-targeting.com",
       // pass: "geLLetti"
    //}
});




function sentTagsEmail(cjb,opt){
    // setup e-mail data with unicode symbols
    //   change  < and >  to coded,  save to file
        //

    cjb.emailstr = opt.emailstr = opt.emailstr || exportToFile(cjb,opt) 
    cjb.emailhtml = opt.emailhtml = opt.emailhtml || genhtmlbody(cjb,opt)
    opt.mailPrefix = opt.mailPrefix = opt.mailPrefix || ""
    sentToAddress =  opt.sentToAddress =  opt.sentToAddress || cjb.csf.sentToAddress || "zd@mojn.com"
    sentToSubject =  opt.sentToSubject =  opt.sentToSubject || opt.mailPrefix + "Feed Transformer: " + cjb.csf.sentToSubject 
    
    var mailopts = {
            from: "webmaster@realtime-targeting.com <webmaster@realtime-targeting.com>", // sender address
            to: sentToAddress, // list of receivers
            subject: sentToSubject, // Subject line
            text: cjb.emalstr, // plaintext body
            html: cjb.emailhtml
    };

    if (opt.mailattachments){
        mailopts.attachments = opt.mailattachments
    } 
      
      
    
    transporter.sendMail(mailopts, function(error, info){
        if(error){
            console.log(error);
        }else{
            console.log('Message sent: ' + info.response);
        }
    });
}




function exportToFile(cjb, opt)
{
    var jobstrings="";
    var avoidarr=["generateTagArray","items","imgTags","emailhtml","input"];
    var newlinearr=["imgTags"];
    for (var jobi in cjb)
    {
        if ( avoidarr.indexOf(jobi) < 0 ){
            if ( newlinearr.indexOf(jobi) >=0){
            jobstrings+=jobi+" : "+ "\n"+cjb[jobi]+"\n";
            }else{jobstrings+=jobi+" : "+ cjb[jobi]+"\n";}
        }
    }
    var exportString="Feed transformer meet an error at:\n" + cjb.csf.sentToSubject + "\nAnd closed your seesion:\n" + opt.errSMS
        
    fs.writeFile(cjb.jobpath + "/" +  smt.gettime() + "_email.txt", exportString, function(err) {
                if(err) {
                    smt.tr( err);
                } else {
                    smt.tr( "The file was saved! :", cjb.jobpath+ "email.txt");
                        }
                    }
                );
    return exportString;
}


function genhtmlbody(cjb,opt){
     var codedhtml=cjb.emailstr.replace(/</g , "&lt;");
     codedhtml=codedhtml.replace(/>/g, "&gt;");
     // insert <br> after </a>
     codedhtml=codedhtml.replace("&lt;a ", "<h2>&lt;a ");
     codedhtml=codedhtml.replace("&lt;/a&gt;", "&lt;/a&gt;</h2>\n\n");
     codedhtml=codedhtml.replace(/&gt;&lt;/g, "&gt;\n&lt;") ;
     codedhtml=codedhtml.replace(/\n/g, "\n<br>\n") ;
     codedhtml="\n\n\n<html>"+"\n<br>\n<p>\n"+codedhtml+"\n</p>\n<br>\n"+ "Do not reply this mail"  +"\n<br>\n</html>\n\n\n";
     //console.log(codedhtml)
     return codedhtml;
 }
 

exports.exportToFile=exportToFile;
exports.sentTagsEmail=sentTagsEmail;