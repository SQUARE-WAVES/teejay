const assert = require("assert");
const build = require("../main.js");

suite("test the builder", () => {
  test("no tags (should be the same as json)",(done) => {
    const input = `{"a":true,"b":[null,54,"snakes",{"z":"b"}]}`;
    const json_out = JSON.parse(input);
    
    const tj_prom = build(input,async () => {
      throw new Error("the tag function should never be called")
    });

    tj_prom
    .then(win =>{
      assert.deepEqual(json_out,win);
      done();
    },
    fail => {
      done(fail);
    })
    .catch(err => done(err));
  });

  test("with tags",(done) => {
    const input = `{"a":<tag>true,"b":<tag2>[null,54,<tag3>"snakes",{"z":"b"}]}`;

    //this is a lil complicated cause its testing a lot of things
    let tstate = 0;
    const tag_function = async (tag,val) => {
      console.log(tag,val);
      switch(tstate) {
        case 0:
          assert.equal("tag",tag);
          assert.equal(true,val);
          tstate = 1;
          return "tag one";
        break;

        case 1:
          assert.equal("tag3",tag);
          assert.equal("snakes",val);
          tstate = 2;
          return "tag two";
        break;

        case 2:
          assert.equal("tag2",tag)
          assert.deepEqual([null,54,"tag two",{"z":"b"}],val);
          return "tag three";
        break;

        default:
          throw new Error("invalid tstate");
      }
    }
    
    const tj_prom = build(input,tag_function);
    const expected_out = {
      "a":"tag one",
      "b":"tag three"
    }

    tj_prom
    .then(win =>{
      assert.deepEqual(expected_out,win);
      done();
    },
    fail => {
      done(fail);
    })
    .catch(err => done(err));
  });

});
