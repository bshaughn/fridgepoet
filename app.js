//including libraries
var app = require('http').createServer(handler),
    io = require('socket.io').listen(app),
    fs = require('fs'),
    static = require('node-static'); // for serving files

//this will make all the files in the current folder accessible from the web
var fileServer = new static.Server('./');

//this is the port for our web server.
app.listen(9000, function(){
    console.log('listening on port 9000');
});

//if the URL of the socket server is opened in a browser
function handler (request, response) {
    request.addListener('end', function () {
        fileServer.serve(request, response);
    }).resume();
}

//delete this row if you want to see debug messages
//io.set('log level', 1);

//include our word slicer
var slicer = require('./js/gutenberg_slicer.js').g_slicer;
var loadWordChunks = require('./js/gutenberg_slicer.js').loadWordChunks;
loadWordChunks();

//include our wordData JSON
var jsonFile = "./js/poetry.json"
var wordData = require(jsonFile);
//number of current users
var numUsers = 0;

//listen for incoming connections from clients
io.on('connection', function (socket) {
    //send word data to new clients
    socket.emit('word_data', wordData);

    //send wordbank words to new clients
    socket.emit('wordbank_words', slicer());
    
    var addedUser = false;
    //when the client emits username
    socket.on('add_user', function(username, clientId) {
        if (addedUser) return;
        //store the username and clientId in the socket session for this client
        socket.username = username;
        socket.clientId = clientId;
        ++numUsers;
        addedUser = true;
        socket.emit('login', {numUsers: numUsers});
        //broadcast to all clients that new user has connected
        socket.broadcast.emit('user_joined', {
            username: socket.username,
            numUsers: numUsers
        });
    });

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

    //when a client requests new words...
    socket.on('refresh_wordbank', function() {
        socket.emit('wordbank_words', slicer());
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

    //when a client completes a drag event...
    socket.on('dragstop', function (data) {
        //broadcast to clients
        socket.broadcast.emit('drag_complete', data);
        //and write new word to JSON
    });

    //when the client disconnects...
    socket.on('disconnect', function() {
        console.log("User Disconnected");
        if (addedUser) {
            --numUsers;
            //broadcast that this client has left
            socket.broadcast.emit('user_left', {
                username: socket.username,
                clientId: socket.clientId,
                numUsers: numUsers
            });
        }
    });
});