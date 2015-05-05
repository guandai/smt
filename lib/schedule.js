var schedule = require('node-schedule');
var fs = require('fs');
var smt = require("./smt");
var tr=smt.tr;
var tobj=smt.tobj;
var request = require('request');


tr("\n\n>>>>>Schedule server just Started")
var allsettings;
fs.readFile("../settings/schedule.json", function(err, filedata)
	{ 
		allsettings = JSON.parse(filedata); 
		main();
	}
);

function main(){
	for(var alsi in allsettings){
		var als =allsettings[alsi];
		if( !als.disable ){
			als.httpshowresult=function (error, response, body) {
						  if (!error && response.statusCode == 200) {
							    console.log("Job Started: ", this.name)
						  }
						}

			als.runschedule =function(){
				console.log(this.name)
						switch (this.type){
							case "url":
									  request(this.url, this.httpshowresult.bind(this))
							    	  break;
							case "callback":
									  tr(smt.gettime());
							    	  Function(this.callback)();
							    	  break
					    }
			}

           //set step in seconds 
			if (als.second == null ){
				var secrange=new schedule.Range(0, 59)
				if (als.secstep>59 && als.secstep<1 ) { als.secstep=60}
				secrange.step=als.secstep
				als.second=secrange				
			}

			schopt={
				year: als.year,
				date: als.date,
				month: als.month,
				dayOfWeek: als.dayOfWeek,
				hour: als.hour,
				minute: als.minute,
				second: als.second
			}
    		
			
			var sch = schedule.scheduleJob( schopt, als.runschedule.bind(als) );
			

			tr(">>>>> run callback for: ",als.name,":")
			if(als.callback) Function(als.callback)()
			console.log(">",als.url);
			console.log(">",als.name,'schedule has been set\n');
		}
	}

	console.log('>>>All schedule has been set');
}

//rule.dayOfWeek = [0, new schedule.Range(4, 6)];
//j.cancel();