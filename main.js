const afsm = require("async-fsm");
const parser_tasks = require("./lib/parser_tasks.js");
const promise_tasks = require("./lib/parser_tasks.js").promise_tasks;

const parser_fsm = afsm(parser_tasks);
const promise_fsm = afsm(promise_tasks);

module.exports = function (input, tag_function, cb) {
  parser_fsm("input", input, tag_function, cb);
};

module.exports.promise = function(input,tag_function){
	return new Promise((resolve,reject) => {
		promise_fsm("input",input,tag_function, (err,result) => {
			if(err){
				reject(err)
			}
			else{
				resolve(result)
			}
		})
	})
}