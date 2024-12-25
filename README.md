TEEJAY
======

like JSON but with tags.

# What is this for?

In a lot of projects, both for myself and for work, I would end up using .json files for configuration stuff like 
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

These configurations are ok as long as they are small, you can easily read the structure, but there is no semantic information. This leaves you with 2 choices:
- Just code the way that each key can be interpreted, this is OK but it makes adding new options a pain, you not only have to specify what those options are, but where they might show up in the config.
- Put extra JSON in that tells you how to interpret the value, which clutters up your configuration and makes it harder to read.

However if you can mark up the values out of band, by using tags to express things beyond "number,string,object,list,null" you can get a lot of the advantages of both styles.

# how does this solve that problem?

TJ, short for "tagged JSON" is a superset of JSON, it adds tags before any (but not necessarily every) value, allowing you to interpret the data as richer types when you parse it. It would take that previous configuration and make it look like this:
```
{
    "database":<postgres_connection_pool>{
        "host":blah blah blah,
        "port":12345,
        "password":"oh no why did I put this in here",
    },
    "some_api":<http_api_client>{
        "host":"http://what.ever",
        "key":"gosh this should also go in a secret, store"
    }
}

```

this doesn't seem like much of a change, but we can go further, by using more tags:
```
{
    "database":<postgres_connection_pool>{
        "host":blah blah blah,
        "port":12345,
        "password":<secret>"the key in your secrets store"
    },
    "some_api":<cached_client> {
        "client":<http_api_client>{
            "host":<service>"the id in your service discovery system",
            "key":<secret>"the secret key"
        },
        "cache_ttl":<minutes>15
    }
}
```

as well if you need a test environment with fake services, just put the fake services in the same slots:
```
{
    "database":<fake_database_pool>,
    "some_api":<fake_api_clinet>{
        "response":<fake_http_response> {
            "code"404,
            "body":<plain text>"its a fake 404 error!"
        }
    }
}
```

# how do I use it?

#### installing
this is hosted on NPM, or you can just grab this repository and pop it in your node modules folder. 
if you want to vendor it, there are only 3 files. main.js lib/parser.js and lib/interp.js those do all the work. 


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
        return "some other creature"
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
    "some other random JSON value"
]`

//this input is trouble because our tag function doesn't know what to do with those tags
const bad_input = `<zip>[ <file>'./dogs/cats/catlist.xml' ]`;

//when you parse the good input you won't have an error, and your results will be:
//["a good boy","some other creature","this will just be a string","some other creature",true,false,"some other random JSON value"];

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
Just return a value or throw an error. There is more info about working with it in the "tips and tricks" section below.

# is this ready for production?

The short answer is "maybe, but be very careful" I've been using this on my personal projects for a few years with no major issues, but I'm the guy who wrote it, and those personal sites don't see tons of traffic or have people trying to hack them or anything. I would advise against something that takes TJ data from un-trusted outside sources unless you are very careful with your tag function. It's also possible that there are errors in the parser which could lead to denial of service attacks or worse things. This is a personal project and just hasn't really been "battle tested" enough for me to tell you it's super robust. Anyways if you decide to use it for something that would be neat and I'd be happy to help with issues.

# tips and tricks!

# about the tag stack

the tag stack lets you have the same tag be interpreted in different ways depending on context. For example "key" might mean one kind of thing for an api client, and another thing for a gear shaft.
By adding this context, tag functions can more easily be built up by composing smaller tag functions made in isolation.

However you don't ever need to do this, for simple enough things just having a flat set of tags and ignoring the stack is fine.


# what kinds of characters are allowed in tags?

What you can put in a tag is limited to a single word featuring the letters a-z (lower case only) the digits 0-9 and the character "_" no spaces no special chars (other than _) 
I made them real simple because I think the best way to make stuff like this work is to compose tags rather than have really complicated tags.

### tag order:

the order tags will be interpreted is well defined, though I don't know the word for it. I call it "lexical stack." basically when the parser reads a tag, it puts it in a stack and moves to the value afterwards. If it parses the whole value (string,number,array,null,nothing) without finding another tag. It pops the first tag off the stack and passes it and the value into the tag function. If it finds another tag it pushes that on to the stack and starts over. Once the stack is clear, the next tag on the next JSON value as it's read will be the next one to show up so for example, in this input the tags will be executed in the order of their names

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


### tags with nothing after:
You don't have to have anything following a tag. you can have something like this:
```
<query>{
	"text":"SELECT * FROM rad_table WHERE level = 'tubular'",
	"db_connection":<global_db_connection>
}
```

the tag function will get called with "global_db_connection" and undefined.
Remeber "null" is a valid JSON value! so something like
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


### self modifiying code:

there is nothing preventing the tag function from altering the meaning of tags as it processes things, which is kind of a double edged sword. It can be very useful in some situations but it can also make things harder to understand. With that in mind I've found it useful to allow for shared references to things.

say you are configuring an http server and you want to have a global database pool. you could make something like this:
```
<server>{
    
    "shared_stuff":<shared_refs>{
        "database_pool":<tag_for_a_db_pool>{...relevant data}
    },
    "routes":[
        <http_route>{
            "verb":GET,
            "path":"/something/or_other",
            "handler":<http_handler>{
                "db":<shared>"database_pool",
                ...other stuff
            }
        },

        <http_route>{
            "verb":GET,
            "path":"/something/or_other",
            "handler":<http_handler>{
                "db":<shared>"database_pool",
                ...other stuff
            }
        }
    ]
}
```

and then make a tag function which looks like this:

```javascript
const make_tag_function = () => {
    const shared_refs= {};
   
    //this tag function uses a bunch of nested ifs because that is easier
    //to write in this example, but in practice it's usually best to use
    //lookup tables!
    return async (tag,value,_stack) => {
        if(tag === "shared_refs") {
            Object.assign(shared_refs,value)
        }
        else if(tag === "shared") {
            const shared_obj = shared_refs[value]

            if shared_obj === undefined {
                throw new Error(`unknown shared tag ${value} requested`)
            }

            return shared_obj;
        }

        //you can imagine what the rest would be like
    }
}
```




