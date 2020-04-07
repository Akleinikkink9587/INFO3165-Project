var imageCanvas;

var message;

window.onload = () => {
    imageCanvas = document.getElementById("imageCanvas");
    message = document.getElementById("message");

    var form = document.forms.namedItem("fileform");

    form.addEventListener('submit', (ev) => {   
        var formData = new FormData(form);
      
        var xhr = new XMLHttpRequest();

        xhr.open("POST", "/submit", true);

        xhr.responseType = "blob";
        
        xhr.onload = (xhrEvent) => {
          if (xhr.status == 200) {
                var image = new Image();
                image.src = URL.createObjectURL(xhr.response);

                image.onload = () => {
                    imageCanvas.height = image.height;
                    imageCanvas.width = image.width;

                    var context = imageCanvas.getContext("2d");

                    context.drawImage(image, 0, 0);

                    message.innerHTML = "There are " + document.cookie.split('=')[1] + " faces in the image.";                    
                };
          } else {
            alert("Error " + xhrEvent.status + " occurred when trying to upload your file.");
          }
        };
      
        xhr.send(formData);
        ev.preventDefault();
      }, false);
}