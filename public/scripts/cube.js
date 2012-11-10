var init = function() {
	var box = $('#cube'),
    	showPanelButtons = $('#show-buttons button'),
    	panelClassName = 'show-front',
    	size = 15,
    	faces = ["front","back","right","left","top","bottom"];

    	onButtonClick = function( event ){
        	box.removeClass( panelClassName );
        	panelClassName = event.target.className;
        	box.addClass( panelClassName );
    	};

	for (var i=0, len = showPanelButtons.length; i < len; i++) {
    	showPanelButtons[i].addEventListener( 'click', onButtonClick, false);
	}

	//for each face
	for (var i=0; i < 6; i++) {
    	//insert the appropriate number of squares
    	for (var j=0, numSquares = size*size; j < numSquares; j++) {
    		if (j===0) {
        		$('#' + faces[i]).append('<div class="square">' + (i+1) + '</div>');
      		} else {
      			var squareClass = (Math.random() < 0.5) ? 'square' : 'square black';
      			$('#' + faces[i]).append('<div class="' + squareClass + '"></div>');
      		}   
    	} 
  	}
};



var findAdjacentSide = function(currentSide,direction) {
	var adjacentSide;

	switch (currentSide) {
		case 'show-front':
			if 		(direction === "right") { adjacentSide = 'show-right';}
			else if (direction === "left") 	{ adjacentSide = 'show-left';}
			else if (direction === "up") 	{ adjacentSide = 'show-top';}
			else if (direction === "down") 	{ adjacentSide = 'show-bottom';}
		break;

		case 'show-back':
			if 		(direction === "right") { adjacentSide = 'show-left';}
			else if (direction === "left") 	{ adjacentSide = 'show-right';}
			else if (direction === "up") 	{ adjacentSide = 'show-bottom';}
			else if (direction === "down") 	{ adjacentSide = 'show-top';}
		break;

		case 'show-left':
			if 		(direction === "right") { adjacentSide = 'show-front';}
			else if (direction === "left") 	{ adjacentSide = 'show-back';}
			else if (direction === "up") 	{ adjacentSide = 'show-top';}
			else if (direction === "down") 	{ adjacentSide = 'show-bottom';}
		break;

		case 'show-right':
			if 		(direction === "right") { adjacentSide = 'show-back';}
			else if (direction === "left") 	{ adjacentSide = 'show-front';}
			else if (direction === "up") 	{ adjacentSide = 'show-top';}
			else if (direction === "down") 	{ adjacentSide = 'show-bottom';}
		break;

		case 'show-top':
			if 		(direction === "right") { adjacentSide = 'show-right';}
			else if (direction === "left") 	{ adjacentSide = 'show-left';}
			else if (direction === "up") 	{ adjacentSide = 'show-back';}
			else if (direction === "down") 	{ adjacentSide = 'show-front';}
		break;

		case 'show-bottom':
			if 		(direction === "right") { adjacentSide = 'show-right';}
			else if (direction === "left") 	{ adjacentSide = 'show-left';}
			else if (direction === "up") 	{ adjacentSide = 'show-front';}
			else if (direction === "down") 	{ adjacentSide = 'show-back';}
		break;
	}

	return adjacentSide;
};

var flipCube = function(direction) {
	var cube = $('#cube');
	var currentSide = cube.attr('class') || 'show-front';
	var flipTo = findAdjacentSide(currentSide,direction);
	cube.removeClass(currentSide).addClass(flipTo);
};

$('#flipRight').click(function() {flipCube('right');});
$('#flipLeft').click(function() {flipCube('left');});
$('#flipUp').click(function() {flipCube('up');});
$('#flipDown').click(function() {flipCube('down');});

window.addEventListener( 'DOMContentLoaded', init, false);