var onmessage = function(e) {
  // var dataURL = JSON.parse(e.data);
  var dataURL = e.data;
  request(dataURL);
}


function request(dataURL) {
  
  var url = '/imager/uploadForWorker';
  var xhr = new XMLHttpRequest();
  xhr.open('POST', url, false);
  
  xhr.onreadystatechange = function() {
    if( xhr.status === 200 ) {
      var result = JSON.parse(xhr.responseText);
      
      if(result.success) {
        var imageURL = result.imageUrl;
        postMessage(JSON.stringify(imageURL));
      }
      
    }
  }
  
  // var uploadData = { image: dataURL };
  // xhr.send(JSON.stringify(uploadData));
  
  xhr.send(dataURL);

}