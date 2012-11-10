var socket = io.connect(document.URL);
var grid = [];
var currentWord;

// on connection to server, ask for user's name with an anonymous callback
socket.on('connect', function(){
	// call the server-side function 'adduser' and send one parameter (value of prompt)
	socket.emit('adduser', prompt("What's your name?") || 'Anonymous');
});

// listener, whenever the server emits 'updatechat', this updates the chat body
socket.on('updatechat', function (username, data) {
	var convo = $('#conversation');
	convo.append('<b>'+username + ':</b> ' + data + '<br>');
	convo.scrollTop(convo.prop('scrollHeight'));
});

// listener, whenever the server emits 'updateusers', this updates the username list
socket.on('updateusers', function(data) {
	$('#users').empty();
	$.each(data, function(key, value) {
		$('#users').append('<div>' + key + '</div>');
	});
});

socket.on('updategrid', function(data) {
	$('#' + data.gameID)
		.empty()
		.data('data', data);
	grid = data.grid;

	for (i=0; i < grid.length; i++) {
		if (grid[i].active === "active") {
			var clue = (data.gridnums[i] != '0') ? '<span class="clueNum">' + data.gridnums[i] + '</span>' : '';
			$('#' + data.gameID).append('<div class="square" data-grid-index=' + i + '>' + clue + '<span class="letter"></span></div>');
		}
		else {
			$('#' + data.gameID).append('<div class="square black"></div>');
		}
	}
});

socket.on('updateletter', function(data) {
	$('#' + data.side + ' .square[data-grid-index="' + data.index + '"]').html(data.letter);
});

socket.on('guessresults', function(data) {
	if (data.result === 'incorrect') {
		var firstSquare = $('.square[data-grid-index="' + data.data.firstSquare + '"]').first();
		var word = getWord(firstSquare, data.data.direction);
		for (var i in word.squares){
			var square = word.squares[i];
			$(square).find('.letter').html('');
		}
	}
	alert(data.result);
});

function getClue(clues, num){
	console.log(num);
	for (var i in clues){
		var n = parseInt(clues[i].split('.')[0]);
		console.log(clues[i]);
		if (n == num){
			return clues[i];
		}
	}
}

function getWordIndex(clues, num){
	console.log(num);
	for (var i in clues){
		var n = parseInt(clues[i].split('.')[0]);
		console.log(clues[i]);
		if (n == num){
			return i;
		}
	}
}

function getWord(square, direction){
	if ($(square).hasClass('black')){
		return null;
	}
	var word = {
		clue:'',
		squares: [],
		answer: ''
	}
	var face = $(square).parent();
	var data = face.data('data');
	console.log(data);
	var allSquares = face.children();
	var index = $(square).index();
	var start;
	if (direction == 'vertical'){
		while (index >= 15){
			if ($(allSquares[index-15]).hasClass('black')){
				break;
			}else {
				index-=15;
			}
		}
		start = index;
		while(index < allSquares.length){
			word.squares.push(allSquares[index]);
			if ($(allSquares[index+15]).hasClass('black')){
				break;
			}else {
				index+=15;
			}
		}
		word.clue = getClue(data.down, data.gridnums[start]);
		word.index = getWordIndex(data.down, data.gridnums[start]);
	}else {
		var place = index % 15;
		var min = index - place;
		var max = index + (15-place);
		while (index > min){
			if ($(allSquares[index-1]).hasClass('black')){
				break;
			}else {
				index--;
			}
		}
		start = index;
		while(index < max){
			word.squares.push(allSquares[index]);
			if ($(allSquares[index+1]).hasClass('black')){
				break;
			}else {
				index++;
			}
		}
		word.clue = getClue(data.across, data.gridnums[start]);
		word.index = getWordIndex(data.across, data.gridnums[start]);
	}
	console.log(word);
	return word;
}
// on load of page
$(function(){
	$('#faceInfo').html('<strong>FRONT</strong> ' + '<span class="puzzleDate">00/00/00</span>');
	// when the client clicks SEND
	$('#datasend').click( function() {
		var message = $('#data').val();
		$('#data').val('');
		// tell server to execute 'sendchat' and send along one parameter
		if (message) {
			socket.emit('sendchat', message);
		}
		$('#data').focus();
	});

	// when the client hits ENTER on their keyboard
	$('#data').keypress(function(e) {
		if(e.which == 13) {
			$(this).blur();
			$('#datasend').focus().click();
		}
	});
	
	$(document).keypress(function(e){
		if (currentWord.done){
			return;
		}
		var letter = String.fromCharCode(e.which);
		letter = letter.match(/[A-Za-z]/);
		var box = false;
		for (var i in currentWord.squares){
			var square = currentWord.squares[i];
			if ($(square).find('.letter').html() !== ''){
				continue;
			}
			box = square;
			break;
		}
		if (!box){
			currentWord.done = true;
			var word = '';
			for (var i in currentWord.squares){
				word += $(currentWord.squares[i]).find('.letter').html();
			}
			socket.emit('checkword', { guess: word, index: currentWord.index, direction: currentWord.direction, side: $(currentWord.squares[0]).closest('.face').attr('id'), firstSquare: $(currentWord.squares[0]).attr('data-grid-index') });
			return;
		}
		socket.emit('sendletter', {letter:letter, index:$(box).attr('data-grid-index'), side: $(box).closest('.face').attr('id') });
		$(box).find('.letter').html(letter);
	});

	$(document).on('click', '.square', function(){
		var direction = ($('.selected').hasClass('vertical')) ? 'vertical' : 'horizontal';
		
		if ($(this).hasClass('selected')){
			if ($(this).hasClass('horizontal')){
				direction = 'vertical';
			} else {
				direction = 'horizontal';
			}
		}
		$('.selected').removeClass('selected');
		$('.horizontal').removeClass('horizontal');
		$('.vertical').removeClass('vertical');
		var word = getWord(this, direction);
		if (!word){
			return;
		}
		var clueDir = (direction === 'vertical') ? 'DOWN' : 'ACROSS';
		$('#clue').html('<strong>' + clueDir + '</strong> ' + word.clue);
		$(word.squares).addClass('selected').addClass(direction);
		word.direction = direction;

		currentWord = word;
	});
});