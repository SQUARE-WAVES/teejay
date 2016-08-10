const fs = require("fs");
const peg = require("pegjs");

const fileName = process.argv[2];
const file = fs.readFileSync(fileName, "utf8");

const out = peg.buildParser(file, {
  "output": "source"
});

console.log(out);