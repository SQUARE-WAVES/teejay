const assert = require("assert");
const tasks = require("../lib/parser_tasks.js");

suite("test the runner tasks", function () {
  test("input task", (done) => {
    const input_text = "whatever";
    const tagfunk = {};

    tasks.input(input_text, tagfunk, (err, state, results, gen, tag_function) => {
      assert.equal(err, null, "no errors should be possible");
      assert.equal(state, "get_next_results", "the correct next state should be chosen");
      assert.equal(results, null, "no results should come from this, it's a kick-off");
      assert.equal(typeof (gen.next), "function", "we should get a generator (or something with the same interface");
      assert.equal(tag_function, tagfunk, "our tag function should be passed through");
      done();
    })
  });

  test("gen_next task", (done) => {
    const val = 1;
    const last_res = "fff";
    const gen = {
      "next": function (lr) {
        assert.equal(lr, last_res, "the last results should be passed in")
        return val;
      }
    }

    const tf = 2;

    tasks.get_next_results(last_res, gen, tf, (err, state, res, the_gen, tag_func) => {
      assert.equal(err, null, "no errors should occur");
      assert.equal(state, "deal_with_results", "the correct state should be chosen");
      assert.equal(res, val, "the results from the generator should be used");
      assert.equal(the_gen, gen, "the generator should be passed through");
      assert.equal(tag_func, tf, "the tag function should be passed through");
      done();
    })
  })

  test("gen_next with exception", (done) => {
    const exc = 1;
    const last_res = "fff";
    const gen = {
      "next": function (lr) {
        assert.equal(lr, last_res, "the last results should be passed in")
        throw exc;
      }
    }

    const tf = 2;

    tasks.get_next_results(last_res, gen, tf, (err) => {
      assert.equal(err, exc, "the error from the gen should be caught");
      done();
    })
  });

  test("deal with results task (generator is done)", (done) => {
    const gen = {};
    const tf = {};
    const results = {
      "value": {},
      "done": true
    };

    tasks.deal_with_results(results, gen, tf, (err, state, tv) => {
      assert.equal(err, null, "no errors here");
      assert.equal(state, null, "no new state here");
      assert.equal(tv, results.value, "the final val should be passed through");
      done();
    })
  });

  test("deal with results (something to build)", (done) => {
    const gen = {};
    const tf = {};
    const tag = "something";
    const val = "an value";
    const ts = []

    const results = {
      "value": {
        "tag": tag,
        "val": val,
        "tag_stack":ts
      },
      "done": false
    };

    tasks.deal_with_results(results, gen, tf, (err, state, restag, resval,resstack, resgen, tag_func) => {
      assert.equal(err, null, "no errors here");
      assert.equal(state, "build_tagval", "the correct state should be chosen");
      assert.equal(restag, tag, "the tag should be passed through");
      assert.equal(resval, val, "the value should be passed through");
      assert.equal(resstack, ts, "the stack should be passed through");
      assert.equal(resgen, gen, "the generator should be passed through");
      assert.equal(tf, tag_func, "the tag function should be passed through");
      done();
    })
  });

  test("build_tagval no error", (done) => {
    const exptag = "corn";
    const expval = "porp";
    const expstack = ["fish"];
    const retval = "corn porp";

    const tagfunk = (tag, val,stack, cb) => {
      assert.equal(tag, exptag, "the correct tag should get fed in");
      assert.deepEqual(stack, expstack, "the correct tag_stack should get fed in");
      assert.equal(val, expval, "the correct value should get fed in");
      cb(null, retval);
    }

    const gen = {}

    tasks.build_tagval(exptag, expval, expstack, gen, tagfunk, (err, state, result, resgen, tag_function) => {
      assert.equal(err, null, "no errors here");
      assert.equal(state, "get_next_results", "the correct state should be chosen");
      assert.equal(result, retval, "the result from the tag function should be gotten");
      assert.equal(resgen, gen, "the generator should pass through");
      assert.equal(tag_function, tagfunk, "the tag function should pass through");
      done();
    })
  })

  test("build_tagval error", (done) => {
    const exptag = "corn";
    const expval = "porp";
    const expstack = ["fish"];
    const reterr = "corn porp";

    const tagfunk = (tag, val, stack,cb) => {
      assert.equal(tag, exptag, "the correct tag should get fed in");
      assert.equal(val, expval, "the correct value should get fed in");
      assert.equal(stack, expstack, "the correct stack should get fed in");

      cb(reterr, null);
    }

    const gen = {}

    tasks.build_tagval(exptag, expval, expstack,gen, tagfunk, (err, state, result, resgen, tag_function) => {
      assert.equal(err, reterr, "the tag functions error should be returned");

      done();
    })
  });

  test("build_tagval promise no error", (done) => {
    const exptag = "corn";
    const expval = "porp";
    const retval = "corn porp";

    const tagfunk = (tag, val) => {
      assert.equal(tag, exptag, "the correct tag should get fed in");
      assert.equal(val, expval, "the correct value should get fed in");
      return Promise.resolve(retval);
    }

    const gen = {}

    tasks.promise_tasks.build_tagval(exptag, expval, gen, tagfunk, (err, state, result, resgen, tag_function) => {
      assert.equal(err, null, "no errors here");
      assert.equal(state, "get_next_results", "the correct state should be chosen");
      assert.equal(result, retval, "the result from the tag function should be gotten");
      assert.equal(resgen, gen, "the generator should pass through");
      assert.equal(tag_function, tagfunk, "the tag function should pass through");
      done();
    })
  });

  test("build_tagval promise error", (done) => {
    const exptag = "corn";
    const expval = "porp";
    const reterr = "corn porp";

    const tagfunk = (tag, val, cb) => {
      assert.equal(tag, exptag, "the correct tag should get fed in");
      assert.equal(val, expval, "the correct value should get fed in");
      return Promise.reject(reterr)
    }

    const gen = {}

    tasks.promise_tasks.build_tagval(exptag, expval, gen, tagfunk, (err, state, result, resgen, tag_function) => {
      assert.equal(err, reterr, "the tag functions error should be returned");
      done();
    })
  });

  test("build_tagval promise, function returns a non promise no error", (done) => {
    const exptag = "corn";
    const expval = "porp";
    const retval = "corn porp";

    const tagfunk = (tag, val) => {
      assert.equal(tag, exptag, "the correct tag should get fed in");
      assert.equal(val, expval, "the correct value should get fed in");
      return retval;
    }

    const gen = {}

    tasks.promise_tasks.build_tagval(exptag, expval, gen, tagfunk, (err, state, result, resgen, tag_function) => {
      assert.equal(err, null, "no errors here");
      assert.equal(state, "get_next_results", "the correct state should be chosen");
      assert.equal(result, retval, "the result from the tag function should be gotten");
      assert.equal(resgen, gen, "the generator should pass through");
      assert.equal(tag_function, tagfunk, "the tag function should pass through");
      done();
    })
  });

  test("build_tagval promise,function returns a non promise error", (done) => {
    const exptag = "corn";
    const expval = "porp";
    const reterr = "corn porp";

    const tagfunk = (tag, val, cb) => {
      assert.equal(tag, exptag, "the correct tag should get fed in");
      assert.equal(val, expval, "the correct value should get fed in");
      throw(reterr);
    }

    const gen = {}

    tasks.promise_tasks.build_tagval(exptag, expval, gen, tagfunk, (err, state, result, resgen, tag_function) => {
      assert.equal(err, reterr, "the tag functions error should be returned");
      done();
    })
  });
});