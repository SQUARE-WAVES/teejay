const assert = require("assert");

suite("test the parser", function () {
  const parse = require("../lib/parser.js").parse;

  test("tag",(done) => {
    const text = `<tagffff>`;
    const tree = parse(text);

    assert.deepEqual(["tag","tagffff"],tree);
    done();
  });

  test("values",(done) => {
    const txt1 = `542`;
    const tree1 = parse(txt1);

    const txt2 = `"sneed"`;
    const tree2 = parse(txt2);

    const txt3 = `false`;
    const tree3 = parse(txt3);
  
    const txt4 = `null`;
    const tree4 = parse(txt4);

    assert.deepEqual(["val",542],tree1);
    assert.deepEqual(["val","sneed"],tree2);
    assert.deepEqual(["val",false],tree3);
    assert.deepEqual(["val",null],tree4);
    done();
  });

  test("array",(done) => {

    const text = `[true,<tagz>"tag",null,[]]`;
    const tree = parse(text);

    const [mode,vals] = tree;

    assert.equal("array",mode);

    assert.deepEqual(["val",true],vals[0]);
    assert.deepEqual(["tagval","tagz",["val","tag"]],vals[1]);
    assert.deepEqual(["val",null],vals[2]);
    assert.deepEqual(["array",[]],vals[3]);
    done();
  });

  test("object",(done) => {

    const text = `{
      "a":true,
      "b":<tagz>"tag",
      "bart":null,
      "smore":[]
    }`;

    const tree = parse(text);

    const [mode,vals] = tree;

    assert.equal("object",mode);

    assert.deepEqual(["a",["val",true]],vals[0]);
    assert.deepEqual(["b",["tagval","tagz",["val","tag"]]],vals[1]);
    assert.deepEqual(["bart",["val",null]],vals[2]);
    assert.deepEqual(["smore",["array",[]]],vals[3]);
    done();
  });
})
