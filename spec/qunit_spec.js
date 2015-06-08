// Qunite is glable assigned
QUnit.module("Basic Tests"); //  until next module ,  all below will be group in this  module.

QUnit.test("truthy", function() {

    var aobj = {
        a: 1,
        b: 2
    };
    var bobj = {
        b: 2,
        c: 3,
        d: 4
    };

    var cobj = {
        b: 2
    };

    var dobj = smt.arraoverb(aobj, bobj);


    var fun = function() {};
    fun["a"] = 1;
    fun["b"] = 2;


    deepEqual(cobj, dobj ) ;

    ok(true, "true is truthy"); // only for 1 param

    equal(1, true, "1 is truthy");

    equal(1, "1", "string and int is same");

    strictEqual(3 - 2, 1, "must  int is same");

    notEqual(0, true, "0 is NOT truthy");

    propEqual(aobj, fun, "obj and array");
});
