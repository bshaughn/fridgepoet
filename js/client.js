jQuery(document).ready(function($){
    //socket port
    var url = 'http://localhost:4444';
    
    //generate a unique client ID
    var clientId = Math.round($.now()*Math.random());
    
    //define clients / cursors
    var clients = {};
    var cursors = {};
    
    //define socket connection
    var socket = io.connect(url);

    //define variable for last emission
    var lastEmit = $.now();
    var prev = {};

    //build DOM using word data from server
    socket.on('word_data', function (data) {
        console.log(data);
        for (var i=0; i<=data.words.length; i++) {
            $('#fridge').append('<div id="'+data.words[i].guid+'" class="word" style="position: absolute; left:'+data.words[i].x+'px; top: '+data.words[i].y+'px;"><p>'+data.words[i].word+'</p></div>');
        }
    });

    //create our wordbank words
    wordcount = 25;
    for (var i=0; i<=wordcount; i++) {
        (function(index){
            $.ajax({
                type: "GET",
                url: "http://randomword.setgetgo.com/get.php",
                crossDomain: true,
                dataType: "jsonp",
                success: function (data, status) {
                    $('#wordbank').append('<div id="'+Math.floor(Math.random() * 1000000000)+'" class="new word"><p>'+data.Word+'</p></div>');
                },
                error: function (xOptions, textStatus) {
                    alert(textStatus);
                }
            });
        })(i);
    }

    //after words are rendered, make them draggable objects
    setTimeout(function(){
        $(".word").draggable({
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
                        'clientId': clientId
                    });
                    lastEmit = $.now();
                }
            }
        });
        makeAbsolute();
        //dragstart handler
        $(".word").on("dragstart", function (event, ui) {
            $(this).addClass("dragging");
        });
        //dragstop handler
        $(".word").on("dragstop", function (event, ui) {
            $(this).removeClass("dragging");
        });
    }, 2000);

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
                    'clientId': clientId
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
                'clientId': clientId
            });
        }
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
        // Saving the current client state
        clients[data.clientId] = data;
        clients[data.clientId].updated = $.now();
    });

    //remove clients' cursors after 10 seconds of inactivity
    setInterval(function(){
        for(clientId in clients){
            if($.now() - clients[clientId].updated > 10000){
                cursors[clientId].remove();
                delete clients[clientId];
                delete cursors[clientId];
            }
        }  
    },10000);

    //update word positions when server provides data
    socket.on('update_position', function (data) {
        moveWord(data.guid, data.x, data.y);
    });

    //move word with server coords
    function moveWord(guid, x, y){
        var thisWord = $("#fridge").find("#" + guid);
        thisWord.css({"left":x, "top":y});
    }

    //if there is a new word on the fridge, render it
    socket.on('create_new_word', function (data) {
        var newWord = $('<div id="'+data.guid+'" class="word animated zoomIn" style="position: absolute; left:'+data.x+'px; top: '+data.y+'px;"><p>'+data.word+'</p></div>');
        $('#fridge').append(newWord);
        //remove animation classes after animation completes
        setTimeout(function(){
            newWord.removeClass('animated zoomIn');
        },1000);
        //bind drag event to new word
        $(newWord).draggable({
            snap: true,
            zIndex: 100,
            drag: function (event, ui) {
                var guid = $(this).attr("id");
                var word = $(this).text();
                var pos = $(this).position();
                //on drag, emit data to server
                if ($.now() - lastEmit > 30) {
                    socket.emit('dragging',{
                        'guid': guid,
                        'word': word,
                        'x': pos.left,
                        'y': pos.top,
                        'clientId': clientId
                    });
                    lastEmit = $.now();
                }
            }
        });
    });

    //state of menu animation
    var isLateralNavAnimating = false;
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

    function makeAbsolute(){
        //get the offset of each word...
        $("#wordbank .word").each(function() {
            var thisPos = $(this).offset();
            $(this).css({"left":thisPos.left, "top":thisPos.top});
        });
        //and then give them an absolute position
        //debounce to ensure top and lefts are set
        $("#wordbank .word").css({"position": "absolute"});
    }

    function makeRelative(){
        //get the offset of each word...
        $("#wordbank .word").each(function() {
            var thisPos = $(this).offset();
            $(this).css({"left":"", "top":"", "position": "relative"});
        });
    }
});