const assert = require("assert");

suite("test the parser", function () {
  const parse = require("../lib/parser.js").parse;

  test("parser generates 1 output per tag", function (done) {
    const input = `[<tag_one>"dogs","this is a distraction",<tag_two>true,<tag_three>"hogs"]`

    const gen = parse(input);

    const v1 = gen.next(1);
    const v2 = gen.next(2);
    const v3 = gen.next(3);
    const v4 = gen.next(4);

    const ev1 = {
      "value": {
        "tag": "tag_one",
        "val": "dogs"
      },
      "done": false
    };

    const ev2 = {
      "value": {
        "tag": "tag_two",
        "val": true
      },
      "done": false
    };

    const ev3 = {
      "value": {
        "tag": "tag_three",
        "val": "hogs"
      },
      "done": false
    };

    //remember the non tagged values should be accounted for correctly
    const ev4 = {
      "value": [2, "this is a distraction", 3, 4],
      "done": true
    };

    assert.deepEqual(v1, ev1, "the 1st value should be correct");
    assert.deepEqual(v2, ev2, "the 2nd value should be correct");
    assert.deepEqual(v3, ev3, "the 3rd value should be correct");
    assert.deepEqual(v4, ev4, "the final value should be correct");
    done();
  });

  test("parser generates tags in the correct order", function (done) {
    //so the order is by "lexical stack" basically tags get pushed on a stack
    //when they are read, then any tags in the following value get pushed onto
    //the stack until a value with no tags is found, at which point the parser
    //spits out that tag and value pair. EG in the input

    const input = `
      {
        "dogs":<third><second><first>"catfish",
        "cats":<fourth>"dogfish",
        "zilbor":<seventh>[<fifth>"gobliz","this is a distraction",<sixth>"robliz"]
      }
    `

    //the expected order would be
    const expected_order = ["first", "second", "third", "fourth", "fifth", "sixth", "seventh"];

    const gen = parse(input);
    const order = [];

    order.push(gen.next().value.tag);
    order.push(gen.next().value.tag);
    order.push(gen.next().value.tag);
    order.push(gen.next().value.tag);
    order.push(gen.next().value.tag);
    order.push(gen.next().value.tag);
    order.push(gen.next().value.tag);

    assert.deepEqual(order, expected_order, "the tags should come back in the correct order")
    done();
  });

  test("parser throws when it hits an exception", function (done) {
    const input = `[<tag_one>"dogs",<tag_two>true",<tag_three>"hogs"[`

    const gen = parse(input);

    const v1 = gen.next(1);
    try {
      const v2 = gen.next(4);
      assert(false, "an exception should have been thrown")
    }
    catch (exc) {
      done();
    }
  })
})