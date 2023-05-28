const parse = require("./lib/parser.js").parse;
const build = require("./lib/interp.js"); 

module.exports = async (text,tag_function) => {
  const tree = parse(text);
  return build(tree,tag_function);
}
