TEEJAY
======

it's like json but with tags.

Here is the node.js implementation

# What is this?

TJ, short for "tagged json" is a superset of JSON for storing data with richish semantics. Basically it takes json and lets you put a tag infront of a value to say what it represents. Then when you parse it you get (potentially) something more than just the json types, like your own stuff from your langage (in this case node.js)

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

# Why did you build this?

I like how json shows the structure of data real easily. You can see what is part of what, and what order things are in. It's not like XML or S-Expressions where everything is awkwardly crammed into lists. However unlike S-expressions or XML you can't really express much semantics in json. You can have only a few types, and the ones that aren't numbers or strings or null are structural in nature.

I also like lua, which has nice syntactic sugar for doing object literal with functions inside of them. Basically there are cases where you can omit parens on function arguments so your data looks nicer. So I decided to do something like that, but in a way that meshes well with node.js because I like using it to make servers 

# Ok how do I use it basically?

well, first you write some tj. Then you probably will want to parse it. To do that you require tj, pass it the input (as a string) and a "tag function" which tells the parser how to interpret the tags. The tag function is asynchronous because that is the "least common denominator" when it comes to node.js. It allows for maximum flexiblity, you can work around it to use promises or something like that.
Here is a contrived example

```javascript
const parse_tj = require("teejay");

const tag_function = async (tag,value) => {
	//do things with the tags.
	//normally you would probably make some kind of lookup table

	if(tag === "animal" && value==="dog"){
    return "a good boy"
	}
	else if(tag === "animal"){
		return "some worthless beast"
	}
	else{
		throw new Error(`I don't know what to do with the tag "${tag}"`)
	}
}

const input = `[<animal>"dog",<animal>"pangolin","this will just be a string",<animal>15,true,false,"some other random json value"]`
const bad_input = `<zip>[<file>'./dogs/cats/catlist.xml'`;

//you won't have an error, and your results will be:
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

so you can basically see how it works, the tag function gets called with the tag, the value of whatever JSON value comes after the tag, you either callback with a value or an error. 

In case it wasn't clear, the values underneath tags don't have to be primatives like strings and numbers and null/true/false type tokens. They can be lists or object that also contain more tags.

# what are the rules for tags?

What you can put in a tag is limited to a single word featuring the letters a-z (lower case only) the digits 0-9 and the character "_" no spaces no special chars (other than _) O made them real dumb to avoid people doing things like putting XML style attributes in their tags. If some true hardcore camelCase dudes start using this and want me to I can add uppercase letters.

# how do I use it advancedly?

Here are a few tips and tricks!

### tags with nothing after:
You don't have to have anything following a tag. you can have something like this:
```
<query>{
	"text":"SELECT * FROM rad_table WHERE level = 'tubular'",
	"db_connection":<global_db_connection>
}
```

the tag function will get called with "global_db_connection" and undefined.

### multi tag:
You can have more than one tag on the same value like

```
<backup><zip><folder>"~/cat_pictures/"
```

these tags will get interpreted from the inside out. First your tag function will see "folder" and "~/cat_pictures/". Then it will see "zip" and the results of the previous call. Finially it will see "backup" and the results of the "zip" call.


### tag order:

the order tags will be interpreted is well defined, though I don't know the word for it. I call it "lexical stack." basically when the parser reads a tag, it puts it in a stack and moves to the value afterwards. If it parses the whole value (string,number,array,nothing) without finding another tag. It pops the first tag off the stack and passes it and the value into the tag function. If it finds another tag it pushes that on to the stack and starts over. Once the stack is clear, the next tag on the next json value as it's read will be the next one to show up so for example, in this input the tags will be executed in the order of their names

```
<last>{
	"something":{
		"a_key":<second><first>"key key",
		"value":<fifth>[<third>"notice how","its not like",<fourth>"the nested keys"] //the third and fourth keys are on the same level, so they go in lexical order
	}
}
```

this means you can do some dirty tricks by having tag functions modify state.

# couldn't I use this to make a turing complete programming language
I'm pretty sure you could but please don't. There are already better programming languages.

# are you gonna do a languge spec or an RFC or something?
maybe, if people find this and like it.
Right now there is a peg.js style grammar in the "grammar" folder, and a little js file that will build a pegjs parser for it. Thats the parser it uses. 

# NOW ONLY WITH ASYNC/AWAIT
I've updated things to use async/await exclusively, as far as I can till this shouldn't mess with anyone too much cause stuff will get versioned and I don't think many other people are using this thing. if you need this to support old school stuff, then we can change it or use v1.2.1
