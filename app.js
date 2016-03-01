// Including libraries
var app = require('http').createServer(handler),
    io = require('socket.io').listen(app),
    fs = require('fs'),
    static = require('node-static'); // for serving files

// This will make all the files in the current folder accessible from the web
var fileServer = new static.Server('./');

// This is the port for our web server.
// you will need to go to http://localhost:4444 to see it
app.listen(4444);

// If the URL of the socket server is opened in a browser
function handler (request, response) {
    request.addListener('end', function () {
        fileServer.serve(request, response);
    });
}

// Delete this row if you want to see debug messages
//io.set('log level', 1);

//include our wordData JSON
var jsonFile = "/Users/rabraham/Documents/Ryan/sites/tests/FridgePoetryTest/js/poetry.json"
var wordData = require(jsonFile);

//Listen for incoming connections from clients
io.on('connection', function (socket) {
    //send word data to new clients
    socket.emit('word_data', wordData);
    //start listening for mouse move events
    socket.on('mousemove', function (data) { 
        socket.broadcast.emit('mousemoving', data);
    });
    //start listening for drag events
    socket.on('dragging', function (data) {
        //send drag data to all other clients
        socket.broadcast.emit('update_position', data);
        //and update the position of the moving word in our JSON file
        for (var i=0; i<wordData.words.length; i++) {
            //check if the word exists in JSON
            if (wordData.words[i].guid == data.guid) {
                wordData.words[i].x = data.x;
                wordData.words[i].y = data.y;
                wordData.words[i].clientId = parseInt(data.clientId); //make sure clientId is int not string...
                //write changes to JSON file
                fs.writeFile(jsonFile, JSON.stringify(wordData, null, 4), function (error) {
                    if (error) {
                        return console.log(error);
                    }
                    console.log(JSON.stringify(wordData));
                    console.log('writing to ' + jsonFile);
                });
                break;
            } else if (!wordData.words[i].hasOwnProperty(data.guid)) { //if the word is new, broadcast to clients
                socket.broadcast.emit('new_word', data);
            }
        }
    });
});