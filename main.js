var afsm = require("async-fsm");
var parser_tasks = require("./lib/parser_tasks.js");

var parser_fsm = afsm(parser_tasks);

module.exports = function (input, tag_function, cb) {
  parser_fsm("input", input, tag_function, cb);
};