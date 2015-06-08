
describe("http return", function() {

    var testresult = "";
    var testurl = "http://localhost:8085/senturl?url=http%3A%2F%2Ftwindai.com%2Fts%2Ftest.json&method=GET";
    //var testjsonpurl = "http://localhost:8085/senturl?url=http%3A%2F%2Ftwindai.com%2Fts%2Ftest.json&method=GET&callback=jsonp_callback";
    
    // console.log(smt);
    // for(var i in smt){
    //     console.log( i );
    // }

    var opt = {
        hostname: "localhost",
        port: 8085,
        path: testurl,
        method: "GET"
    };

    beforeEach(function(done) {
        //spyOn( main , "run").and.callThrough(); 
      
        opt.callback = function(data) {
            testresult = data;
            done();
        };
        //smt.httpfullbody(opt);
        setTimeout(done,50);
        
    });

    it("get time", function(done) {
        //console.log(testresult)
        var t= smt.gettime(0);
        smt.tc(t);
        expect(t).toMatch(/\d{6}-\d{6}/);
        done();
    });

   it("ARRAY a in b", function() {
        //console.log(testresult)
        var a = [1,2];
        var b = [3,4];
        var c = [1,2,3,4];
        
        expect( smt.arrainbtest(a,b) ).toBeFalsy();
        //expect( smt.arrainbtest(a,c) ).toBeTruthy();
    });

});