const parse_gen = require("./parser.js").parse;

const parser_tasks = {

  "input": function (input_text, tag_function, next) {
    const gen = parse_gen(input_text);
    next(null, "get_next_results", null, gen, tag_function);
  },

  //we don't need to worry about next, async-fsm handles the defering
  "get_next_results": function (last_results, gen, tag_function, next) {
    let results = null;

    try {
      results = gen.next(last_results);
    }
    catch (exc) {
      next(exc);
      return;
    }

    next(null, "deal_with_results", results, gen, tag_function)
  },

  "deal_with_results": function (results, gen, tag_function, next) {
    const tag_val = results.value;
    const done = results.done;

    if (done) {
      next(null, null, tag_val);
      return;
    }
    else {
      next(null, "build_tagval", tag_val.tag, tag_val.val,tag_val.tag_stack, gen, tag_function)
    }
  },

  "build_tagval": function (tag, val, stack, gen, tag_function, next) {
    tag_function(tag, val, stack, function (err, res) {
      if (err) {
        next(err)
      }
      else {
        next(null, "get_next_results", res, gen, tag_function)
      }
    })
  },
}

module.exports = parser_tasks;

module.exports.promise_tasks = Object.assign({},parser_tasks,{  "build_tagval": function (tag, val, gen, tag_function, next) {
    let res_prom = null

    try {
      const tag_res = tag_function(tag, val);
      res_prom = Promise.resolve(tag_res);
    }
    catch(err){
      res_prom = Promise.reject(err)
    }

    res_prom
    .then(res => next(null,"get_next_results",res,gen,tag_function))
    .catch(err => next(err));
  }})