TEEJAY
======

it's like json but with tags.

# What is this?

TJ, short for "tagged json" is a superset of JSON for storing data with richish semantics. Basically it takes json and lets you put a tag infront of a value to say what it represents. Then when you parse it you get (potentially) something more than just the json types, but your own stuff from your langage (in this case node.js)

it can look like this:
```
<dictonary_entry>{
	"word":"horse",
	"definition":"a big crazy animal that's crazy",
	"etymology":<root_word>"hoooorrrrsssseeee!",
	"citations":[
		<book>{
			"title":"the weird animals of this world",
			"bookid":"xyz123"
		},
		<magazine>{
			"title":"animal fancy",
			"date":<date>"12-31-1969"
		}
	]
}
```

or even simpler like
```
<thing>"this is a thing"
```

or hell it can just be a tag
```
<dog>
```

the point is, when you parse a piece of tj, you get some extra context thrown in. All you have to do is tell the system how to interpret that context.

# What is this for?

A lot of the time, in projects both for myself and for work, I would end up using .json files for configuration stuff like 
```json
{
    "database":{
        "host":blah blah blah,
        "port":12345,
        "password":"oh no why did I put this in here",
    },
    "some_api":{
        "host":"http://what.ever",
        "key":"gosh this should also go in a secret, store"
    }
}
```

I like how json shows the structure of data real easily. You can see what is part of what, and what order lists of things are in. It's not like XML or S-Expressions where everything is awkwardly crammed into lists. However unlike S-expressions or XML you can't really express much semantics in json. You can have only a few types, and the ones that aren't numbers or strings or null are structural in nature.

I also like lua, which has nice syntactic sugar for doing object literals with functions inside of them. Basically there are cases where you can omit parens on function arguments so your data looks nicer. So I decided to do something like that, but in a way that meshes well with node.js because I like using it to make servers.

# how do I use it?

#### installing
this is hosted on NPM, or you can just grab this repo and pop it in your node modules folder. if you really want it, there are only 3 files. main.js lib/parser.js and lib/interp.js those do all the work.


#### writing programs:
the teejay module only exports one function, that takes 2 arguments: the input text (as a string) and an async function which tells the parser how to interpret the tags. I usually call that thing the tag function.

Here is a little example:

```javascript
const parse_tj = require("teejay");

const tag_function = async (tag,value,stack) => {
    //do things with the tags.
    //normally you would probably make some kind of lookup table

    if(tag === "animal" && value==="dog") {
        return "a good boy"
	}
	else if(tag === "animal") {
        return "some worthless beast"
	}
	else {
		throw new Error(`I don't know what to do with the tag "${tag}"`)
	}
}

const input = `
[
    <animal>"dog",
    <animal>"catfish",
    "this will just be a string",
    <animal>15,
    true,
    false,
    "some other random json value"
]`

//this input is trouble because our tag function doesn't know what to do with those tags
const bad_input = `
<zip>[
    <file>'./dogs/cats/catlist.xml'
]`;

//when you parse the good input you won't have an error, and your results will be:
//["a good boy","some worthless beast","this will just be a string","some worthless beast",true,false,"some other random json value"];
const values = await parse_tj(input,tag_function);

try {
  await parse_tj(bad_input,tag_function, (err,results) => {
}
catch(err) {
  //oh boy this is gonna error with the message 
	//'I don't know what to do with the tag "file"'
  console.log(err.stack);
}
```

so you can basically see how it works, the tag function gets called with the current tag, the value of whatever JSON value comes after the tag, and a stack of other tags that are pending evaluation
Just return a value o throw an error.

In case it wasn't clear, the values underneath tags don't have to be primatives like strings and numbers and null/true/false type tokens. They can be lists or object that also contain more tags.

# what kinds of charachters are allowed in tags?

What you can put in a tag is limited to a single word featuring the letters a-z (lower case only) the digits 0-9 and the character "_" no spaces no special chars (other than _) 

I made them real simple because I think the best way to make stuff like this work is to compose tags rather than have really complicated tags.

### tag order:

the order tags will be interpreted is well defined, though I don't know the word for it. I call it "lexical stack." basically when the parser reads a tag, it puts it in a stack and moves to the value afterwards. If it parses the whole value (string,number,array,null,nothing) without finding another tag. It pops the first tag off the stack and passes it and the value into the tag function. If it finds another tag it pushes that on to the stack and starts over. Once the stack is clear, the next tag on the next json value as it's read will be the next one to show up so for example, in this input the tags will be executed in the order of their names

```
<last>{
	"something":{
		"a_key":<second><first>"key key",
		"value":<fifth>[
            <third>"notice how",
            "its not like",
            <fourth>"the nested keys"
        ]
	}
}
```

in this situation the tag function will get called like this: 

```
tag_function("first","key key",["last","second"]);
tag_function("third","notice how",["last","fifth"]);
tag_function("fourth","the nested keys",["last","fifth"]);
tag_function("fifth",[some val, some val],["last"]);
tag_function("last",{...the object with the values from before}, []);
```

# tips and tricks!

### tags with nothing after:
You don't have to have anything following a tag. you can have something like this:
```
<query>{
	"text":"SELECT * FROM rad_table WHERE level = 'tubular'",
	"db_connection":<global_db_connection>
}
```

the tag function will get called with "global_db_connection" and undefined.
Remeber "null" is a valid json value! so something like
```
<global_db_connection>null
```
is a legit expression, and your tag function will be called with null as an argument. This is just one of those quirks of JS and JSON that we have to deal with.

### multi tag:
You can have more than one tag on the same value like

```
<backup><zip><folder>"~/cat_pictures/"
```

these tags will get interpreted from the inside out. First your tag function will see "folder" and "~/cat_pictures/". Then it will see "zip" and the results of the previous call. Finially it will see "backup" and the results of the "zip" call.
