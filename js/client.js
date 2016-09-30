jQuery(document).ready(function($){
    //VARS

    //socket port
    //var url = 'http://ec2-54-193-61-98.us-west-1.compute.amazonaws.com:9000';
    var url = 'http://localhost:4444';
    
    //generate a unique client ID
    var clientId = Math.round($.now()*Math.random());
    var username;
    
    //define clients / cursors
    var clients = {};
    var cursors = {};

    //bools for dragging
    var dragging = false;
    var othersDragging = false;
    
    //define socket connection
    var socket = io.connect(url);

    //define variable for last emission
    var lastEmit = $.now();
    var prev = {};

    //state of menu animation
    var isLateralNavAnimating = false;

    //VW
    var viewportWidth = $(window).width();

    //CLIENT EVENTS

    //build fridge view using word data from server
    socket.on('word_data', function (data) {
        if (data.words.length == 0) {
            return;
        } 
        for (var i=0; i<=data.words.length-1; i++) {
            $('#fridge').append('<div id="'+data.words[i].guid+'" class="word" style="position: absolute; left:'+data.words[i].x+'px; top: '+data.words[i].y+'px;"><p>'+data.words[i].word+'</p></div>');
        }
    });

    //populate the wordbank
    function populateWordBank(words) {
        if (!words) {return;}
        wordcount = 25;
        //for (var i=0; i<=wordcount; i++) {
            for (var i=0; i<wordcount; i++) {
            $('#wordbank').append('<div id="'+Math.floor(Math.random() * 1000000000)+'" class="new word"><p>'+words[i]+'</p></div>');
        }
        //makeAbsolute();    // These might be what to change
        var tile = $(".word");  //for the colophon to work
        bindEvents(tile);
    }

    //a reusable function for binding drag events
    function bindEvents(tile) {
        bindDrag(tile);
        bindDragStart(tile);
        bindDrop(tile);
    }

    //dragstart handler
    function bindDragStart(tile) {
        tile.on("dragstart", function (event, ui) {
            $(this).addClass("dragging");
        });
    }

    //drag handler
    function bindDrag(tile) {
        tile.draggable({
            snap: true,
            zIndex: 100,
            drag: function (event, ui) {
                var guid = $(this).attr("id");
                var word = $(this).text();
                var pos = $(this).position();
                //on drag, emit data to server
                if ($.now() - lastEmit > 30){
                    socket.emit('dragging',{
                        'guid': guid,
                        'word': word,
                        'x': pos.left,
                        'y': pos.top,
                        'clientId': clientId,
                        'username': username
                    });
                    lastEmit = $.now();
                    dragging = true;
                }
            }
        });  
    }

    //dragstop handler
    function bindDrop(tile) {
        tile.on("dragstop", function (event, ui) {
            $(this).removeClass("dragging");
            dragging = false;
            var guid = $(this).attr("id");
            var word = $(this).text();
            socket.emit('dragstop',{
                'guid': guid,
                'word': word,
                'username': username
            });
        });
    }

    //change word's parent container if they are dragged from wordbank to fridge
    $("#fridge").droppable({
        drop: function(event, ui) {
            //move the element to the new parent
            $(this).append(ui.draggable);
            var newWord = ui.draggable;
            var guid = newWord.attr("id");
            var word = newWord.text();
            var pos = newWord.position();
            //if the word was dropped from the wordbank, tell the server there is a new word on the fridge
            if (newWord.hasClass('new')) {
                socket.emit('new_word',{
                    'guid': guid,
                    'word': word,
                    'x': pos.left,
                    'y': pos.top,
                    'clientId': clientId,
                    'username': username
                });
                newWord.removeClass('new');
            }
        }
    });

    //emit mousemove data to server
    $("body").mousemove(function (event) {
        if($.now() - lastEmit > 30){
            socket.emit('mousemove',{
                'x': event.pageX,
                'y': event.pageY,
                'dragging': dragging,
                'clientId': clientId
            });
        }
    });

    //remove clients' if they've disconnected
    function removeCursor(data) {
        cursors[data].remove();
    }

    //move word with server coords
    function moveWord(guid, x, y) {
        var thisWord = $("#fridge").find("#" + guid);
        thisWord.css({"left":x, "top":y});
        if (othersDragging == true) {
            thisWord.addClass('dragging');
        }
    }

    //create participants message
    function participants(data) {
        var message = '';
        if (data.numUsers === 1) {
            message += "there's 1 poet";
        } else {
            message += "there are " + data.numUsers + " poets";
        }
        log(null, message);
    }

    //add a message to messageboard
    function log(user, message) {
        if (user == null){
            var $el = $('<li class="message animated fadeInUp">' + message + '</li>');
        } else {
            var $el = $('<li class="message animated fadeInUp"><span>' + user + '</span>' + message + '</li>');
        }
        var $messages = $('.messages');
        $messages.append($el);
        //animate messages
        setTimeout(function(){
            $el.removeClass('fadeInUp');
            $el.addClass('fadeOutUp');
            setTimeout(function(){
                $el.remove();
            }, 1000);
        }, 3000);
    }

    //when enter key is pressed...
    $(window).keydown(function(event) {
        //submit username
        if (event.which === 13) {
            username = cleanInput($('.username-input').val().trim());
            setUsername(username);
        }
    });

    //if the user chooses to proceed anonymously...
    $("#anonymous").on('click', function() {
        username = 'anonymous';
        setUsername(username);
    });

    //set username
    function setUsername(username) {
        if (username == 'anonymous' || !username == '') {
            var $loginPage = $('#login-page'); // The login page
            $loginPage.fadeOut();
            $loginPage.off('click');
            socket.emit('add_user', username, clientId);
            $('body').removeClass('overflow-hidden');
        } else if (username == '') {
            alert('enter a pen name you dingus!');
        }
    }

    //prevent injection in username field
    function cleanInput(input) {
        return $('<div/>').text(input).text();
    }

    //request new words
    $('#refresh-button').on('click', function() {
        $('#wordbank').empty();
        socket.emit('refresh_wordbank');
    });

    //menu event handler
    $('.nav-trigger').on('click', function(event){
        event.preventDefault();
        //stop if nav animation is running 
        if( !isLateralNavAnimating ) {
            if($(this).parents('.csstransitions').length > 0 ) isLateralNavAnimating = true; 
            $('body').toggleClass('navigation-is-open');
            if ($('body').hasClass('navigation-is-open')) {
                //wait for transition to complete
                setTimeout(function(){
                    makeAbsolute();
                }, 600);
            } else {
                makeRelative();
            }
            $('.navigation-wrapper').one('webkitTransitionEnd otransitionend oTransitionEnd msTransitionEnd transitionend', function(){
                //animation is over
                isLateralNavAnimating = false;
            });
        }
    });

    //set wordbank words' position to absolute
    function makeAbsolute(){
        //get the offset of each word...
        $("#wordbank .word").each(function() {
            var thisPos = $(this).position();
            //var thisWidth = $(this).innerWidth();
            $(this).css({"left":thisPos.left, "top":thisPos.top});
        });
        //and then give them an absolute position
        //debounce to ensure top and lefts are set
        $("#wordbank .word").css({"position": "absolute"});
    }

    //set wordbank words' position to absolute
    function makeRelative(){
        //get the offset of each word...
        $("#wordbank .word").each(function() {
            $(this).css({"left":"", "top":"", "position": "relative"});
        });
    }
    
    //hide the wordbank initially on mobile
    if (viewportWidth <= 768) {
        $('body').removeClass('navigation-is-open');
    }

    //SERVER EVENTS

    //populate wordbank when server sends words
    socket.on('wordbank_words', function (data) {
        populateWordBank(data);
    });

    //update cursor positions when server provides data
    socket.on('mousemoving', function (data) {
        //if a new user has come online, create a cursor for them
        if (!(data.clientId in clients)){
            cursors[data.clientId] = $('<div class="cursor">').appendTo('#cursors');
        }
        //move the mouse
        cursors[data.clientId].css({
            'left' : data.x,
            'top' : data.y
        });
        //change the cursor if dragging is set to true
        if (data.dragging) {
            cursors[data.clientId].addClass('cursor-dragging');
            othersDragging = true;
        } else {
            cursors[data.clientId].removeClass('cursor-dragging');
            othersDragging = false;
        }
        // Saving the current client state
        clients[data.clientId] = data;
        clients[data.clientId].updated = $.now();
    });

    //update word positions when server provides data
    socket.on('update_position', function (data) {
        moveWord(data.guid, data.x, data.y);
    });

    //if there is a new word on the fridge, render it
    socket.on('create_new_word', function (data) {
        var newWord = $('<div id="'+data.guid+'" class="word animated zoomIn" style="position: absolute; left:'+data.x+'px; top: '+data.y+'px;"><p>'+data.word+'</p></div>');
        $('#fridge').append(newWord);
        //remove animation classes after animation completes
        setTimeout(function(){
            newWord.removeClass('animated zoomIn');
        },1000);
        //log a message
        log(data.username, ' introduced word: '+ data.word);
        //bind drag events to new word
        var tile = newWord;
        bindEvents(tile);
    });

    //when another client completes a drag...
    socket.on('drag_complete', function (data) {
        //log a message
        log(data.username, ' moved word: '+ data.word);
        //and remove dragging class
        var thisWord = $("#fridge").find("#" + data.guid);
        thisWord.removeClass('dragging'); 
    });

    //whenever the server emits 'user joined', display data on the message board
    socket.on('user_joined', function(data) {
        log(data.username, ' entered the kitchen');
        participants(data);
    });

    //whenever the server emits 'user left', log it in the chat body
    socket.on('user_left', function(data) {
        log(data.username, ' left the kitchen');
        removeCursor(data.clientId);
        participants(data);
    });

});