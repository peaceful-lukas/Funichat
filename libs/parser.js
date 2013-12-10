module.exports = {
  parse: function(unparsed) {
    var parsed = null;
    
    try {
      parsed = JSON.parse(unparsed);
      
      var keys = Object.keys(parsed);
      for( var key in keys ) {
        parsed[key] = parse(parsed[key]);
      }
      
      return parsed;
    }
    catch(e) {
      return parsed;
    }
  }
}