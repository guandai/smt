var smt = require("../src/smt");

describe("test each functions ", function() {
    // var tr = smt.tr
    var testobj = {
        a: 1,
        b: true,
        c: "I am a string",
        d: function(arg) {
            console.log(arg);
        }
    };

    it("basic test", function() {
        expect(true).toBe(true);
    });


    it(" >  cutdec function", function() {
        var str = smt.cutdec("11.223456", 3);
        expect(str).toBe("11.22");
    });


    it(" >  shortenunit function", function() {
        var str = smt.shortenunit(11223456);
        expect(str).toBe("10.7 MB");
    });

    it(" >  osize function", function() {
        var num = smt.osize(testobj);
        expect(num).toBe(4);
    });


    it(" object slice ", function() {
        //console.log(testresult)

        expect(testobj.slice(1, 2)).toEqual({
            b: true,
            c: "I am a string"
        });
    });


});


describe("http test in smt", function() {
    var testresult = "";
    var testurl = "http://localhost:8085/senturl?url=http%3A%2F%2Ftwindai.com%2Fts%2Ftest.json&method=GET";
    //var testjsonpurl = "http://localhost:8085/senturl?url=http%3A%2F%2Ftwindai.com%2Fts%2Ftest.json&method=GET&callback=jsonp_callback";

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
        smt.httpfullbody(opt);
        setTimeout(done, 50);

    });

     it(" object slice ", function() {
        //console.log(testresult)

        expect(testresult.length).toEqual(2449);
    });
})
