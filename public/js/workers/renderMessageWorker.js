var onmessage = function(e) {
  var messages = JSON.parse(e.data);
  request(messages);
}


function request(messages) {
  var list = [];
  var count = messages.length;
  
  for(var i=0; i<messages.length; i++) {
    var url = '/messageForWorker';
    var xhr = new XMLHttpRequest();
    xhr.open('POST', url, false);
    
    xhr.onreadystatechange = function() {
      if( xhr.status === 200 ) {
        list.push(xhr.responseText);
        count--;
        
        if(count === 0) {
          postMessage(JSON.stringify(list));
        }
      }
    }
    
    xhr.send(JSON.stringify(messages[i]));
  }
}