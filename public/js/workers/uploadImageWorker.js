var onmessage = function(e) {
  // var dataURL = JSON.parse(e.data);
  var dataURL = e.data;
  request(dataURL);
}


function request(dataURL) {
  
  var url = '/imager/uploadForWorker';
  var xhr = new XMLHttpRequest();
  
  xhr.onreadystatechange = function() {
    switch( xhr.readyState ) {
      case 1:
        xhr.setRequestHeader("Content-type", "plain/text");
        xhr.send(dataURL);
        break;
      
      case 4:
        var result = JSON.parse(xhr.responseText);
        
        if(result.success) {
          var imageURL = result.imageUrl;
          postMessage(imageURL);
        }
        else {          
          postMesssage('failed');
        }
        break;
    }
  }
  
  xhr.open('POST', url, true);
  console.log('worker xhr open!');
  
  
  
  // var uploadData = { image: dataURL };
  // xhr.send(JSON.stringify(uploadData));


}