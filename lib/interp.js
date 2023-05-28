const interp_tree = async (tree,tag_function) => {

  const [symbol,...tail] = tree;

  switch(symbol) {
    case "val": {
        return tail[0];
    }
    break;

    case "tag": {
      const t = tail[0];
      return await tag_function(t);
    }
    break;

    case "tagval": {
      const [t,v] = tail;
      const full_val = await interp_tree(v,tag_function);
      return await tag_function(t,full_val);
    }
    break;

    //in order to preserve sequentiality rules we have to do these one step at a time
    case "array": {
      //preallocating for perf
      const entries = tail[0]
      const result = new Array(entries.length);

      for(let i=0; i < entries.length; ++i)
      {
        result[i] = await interp_tree(entries[i],tag_function);
      }

      return result;
    }
    break;

    case "object": {
      const entries = tail[0]
      const result = {};

      for(let i=0; i < entries.length; ++i)
      {
        const [k,v] = entries[i];
        result[k] = await interp_tree(v,tag_function);
      }

      return result;
    }
    break;
  }
}

module.exports = interp_tree;
