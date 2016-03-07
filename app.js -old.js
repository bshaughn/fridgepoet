// Including libraries
var app = require('http').createServer(handler),
    io = require('socket.io').listen(app),
    fs = require('fs'),
    static = require('node-static'); // for serving files

var slicer = require('./gutenberg_slicer.js').g_slicer;
var loadWordChunks = require('./gutenberg_slicer.js').loadWordChunks;

loadWordChunks();

//console.log("Slicer output: " + slicer());

// This will make all the files in the current folder accessible from the web
var fileServer = new static.Server('./');

//console.log(fileServer)

// This is the port for our web server.
// you will need to go to http://localhost:4444 to see it
//app.listen(4444);

app.listen(4444, function(){
    console.log('listening on *.4444');
});

// If the URL of the socket server is opened in a browser
function handler (request, response) {
    request.addListener('end', function () {
        fileServer.serve(request, response);
    }).resume();
}

// Delete this row if you want to see debug messages
//io.set('log level', 1);

//include our wordData JSON
//var jsonFile = "/Users/rabraham/Documents/Ryan/sites/tests/FridgePoetryTest/js/poetry.json"
var jsonFile = "/Users/bartshaughnessy/fridgepoet/js/poetry.json"
var wordData = require(jsonFile);

//var testwords = slicer();

//Listen for incoming connections from clients
io.on('connection', function (socket) {
    //send word data to new clients
   // socket.emit('word_data', wordData);
    //start listening for mouse move events

   // socket.emit('heres-your-words', testwords);
   socket.emit('heres-your-words', slicer());

    socket.emit('word_data', wordData);

    socket.on('mousemove', function (data) { 
        socket.broadcast.emit('mousemoving', data);
    });

    var testwords = slicer();

    /*
    socket.on('gimme-words', function() {
        console.log("called Gimme words");
        //var testwords = slicer();
        console.log("preparing to emit HERES YOUR WORDS");
        io.emit('heres-your-words', slicer());
    });
    */

    //start listening for drag events
    socket.on('dragging', function (data) {
        //send drag data to all other clients
        socket.broadcast.emit('update_position', data);
        //and update the position of the moving word in our JSON file
        for (var i=0; i<wordData.words.length; i++) {
            //check if the word exists in JSON
            if (wordData.words[i].guid == data.guid) {
                wordData.words[i].guid = parseInt(data.guid); //make sure clientId is int
                wordData.words[i].x = data.x;
                wordData.words[i].y = data.y;
                wordData.words[i].clientId = parseInt(data.clientId); //make sure clientId is int
                //write changes to JSON file
                fs.writeFile(jsonFile, JSON.stringify(wordData, null, 4), function (error) {
                    if (error) {
                        return console.log(error);
                    }
                });
                break;
            }
        }
    });
    //when a client introduces a new word...
    socket.on('new_word', function (data) {
        //broadcast to clients
        socket.broadcast.emit('create_new_word', data);
        //and write new word to JSON
        wordData['words'].push({"guid":parseInt(data.guid),"word":data.word,"x":data.x,"y":data.y,"clientId":parseInt(data.clientId)});
        fs.writeFile(jsonFile, JSON.stringify(wordData, null, 4), function (error) {
            if (error) {
                return console.log(error);
            }
            console.log('added new word to ' + jsonFile);
        });
    })
    .on('sign-on', function(){
        console.log('User connected');
    });
});