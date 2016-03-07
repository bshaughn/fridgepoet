// Including libraries
var app = require('http').createServer(handler),
    io = require('socket.io').listen(app),
    fs = require('fs'),
    static = require('node-static'); // for serving files

var slicer = require('./gutenberg_slicer.js').g_slicer;
var loadWordChunks = require('./gutenberg_slicer.js').loadWordChunks;

loadWordChunks();

// This will make all the files in the current folder accessible from the web
var fileServer = new static.Server('./');

// This is the port for our web server.
// you will need to go to http://localhost:4444 to see it
app.listen(4444, function(){
    console.log('listening on *.4444');
});

// If the URL of the socket server is opened in a browser
function handler (request, response) {
    request.addListener('end', function () {
        fileServer.serve(request, response);
    }).resume();
}

//delete this row if you want to see debug messages
//io.set('log level', 1);

//include our wordData JSON
//var jsonFile = "/Users/rabraham/Documents/Ryan/sites/tests/FridgePoetryTest/js/poetry.json"
var jsonFile = "/Users/bartshaughnessy/fridgepoet/js/poetry.json"
var wordData = require(jsonFile);
//number of current users
var numUsers = 0;

//Listen for incoming connections from clients
io.on('connection', function (socket) {
    var addedUser = false;

   // socket.emit('heres-your-words', slicer());

    //when the client emits username
    socket.on('add user', function(username, clientId) {
        if (addedUser) return;
        //store the username and clientId in the socket session for this client
        socket.username = username;
        socket.clientId = clientId;
        ++numUsers;
        addedUser = true;
        socket.emit('login', {numUsers: numUsers});
        socket.emit('heres-your-words', slicer());
        //broadcast to all clients that new user has connected
        socket.broadcast.emit('user joined', {
            username: socket.username,
            numUsers: numUsers
        });
    });

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
                wordData.words[i].guid = parseInt(data.guid); //make sure clientId is int
                wordData.words[i].x = data.x;
                wordData.words[i].y = data.y;
                wordData.words[i].clientId = parseInt(data.clientId); //make sure clientId is int
                wordData.words[i].username = data.username; //make sure clientId is int
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
        wordData['words'].push({"guid":parseInt(data.guid),"word":data.word,"x":data.x,"y":data.y,"clientId":parseInt(data.clientId),"username":data.username});
        fs.writeFile(jsonFile, JSON.stringify(wordData, null, 4), function (error) {
            if (error) {
                return console.log(error);
            }
        });
    });

    //when a user completes a drag event...
    socket.on('dragstop', function (data) {
        console.log(data);
        //broadcast to clients
        socket.broadcast.emit('drag_complete', data);
        //and write new word to JSON
    });

    //when the user disconnects...
    socket.on('disconnect', function() {
        if (addedUser) {
            --numUsers;
            // echo globally that this client has left
            socket.broadcast.emit('user left', {
                username: socket.username,
                clientId: socket.clientId,
                numUsers: numUsers
            });
        }
    });
});