const parse = require("./parser.js").parse;
const build = require("./interp.js"); 

const build_the_stuff = async (text,tag_function) => {
  const tree = parser(text);
  return build(tree,tag_function)
}

module.exports = build_the_stuff;
