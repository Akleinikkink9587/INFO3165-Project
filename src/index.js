require('@tensorflow/tfjs-node');

const express = require('express');
var formidable = require('formidable');

const path = require('path');
const fs = require('fs');
const { promisify } = require("util");

const unlink = promisify(fs.unlink);
const writeFile = promisify(fs.writeFile);

var port = 8080; //TODO:

// Create a new express application instance
const app = express();

app.get('/', function(req, res){
    res.sendFile(path.join(__dirname, "./page/index.html"));
});

app.get('/stylesheet.css', function(req, res){
    res.sendFile(path.join(__dirname, "./page/stylesheet.css"));
});

app.get('/javascript.js', function(req, res){
    res.sendFile(path.join(__dirname, "./page/javascript.js"));
});

app.post('/submit', async function(req, res, next){
    var form = new formidable.IncomingForm();

    form.parse(req);

    var fileBase;
    var fileName;
    var fileMime;

    form.onPart = part => {
        if(part.mime){
            fileMime = part.mime;
        }
        form.handlePart(part);
    };

    form.on('fileBegin', (name, file) => {
        fileBase = file.path;
        fileName = file.name;

        file.path = path.join(__dirname, fileBase + "_" + fileName);
    });

    form.on('end', async () => {
        await detectFaces(fileBase, fileName, fileMime);

        res.sendFile(path.join(__dirname, fileBase + "_mod_" + fileName), async (err) =>{
            await unlink(path.join(__dirname, fileBase + "_" + fileName));
            await unlink(path.join(__dirname, fileBase + "_mod_" + fileName));

            if(err) {
                next(err);
            }   
        });
    });
});

const MODELS_PATH = "./src/models";

const faceapi = require('face-api.js');
const canvas = require('canvas');
const { Canvas, Image, ImageData } = canvas;
faceapi.env.monkeyPatch({ Canvas, Image, ImageData });

async function detectFaces(fileBase, fileName, fileMime){
    await faceapi.nets.ssdMobilenetv1.loadFromDisk(MODELS_PATH);

    const img = await canvas.loadImage(path.join(__dirname, fileBase + "_" + fileName));

    const detections = await faceapi.detectAllFaces(img, new faceapi.SsdMobilenetv1Options())

    const outputCanvas = faceapi.createCanvasFromMedia(img);

    faceapi.draw.drawDetections(outputCanvas, detections);

    await writeFile(path.join(__dirname, fileBase + "_mod_" + fileName), outputCanvas.toBuffer(fileMime));
}

//start
app.listen(port, function () {
    console.log('Listening on port: ' + port);

    var tempDir = "./src/tmp";

    if (!fs.existsSync(tempDir)){
        fs.mkdirSync(tempDir);
    }

    console.log('Directory created: ' + tempDir);
});