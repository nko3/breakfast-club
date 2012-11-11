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
	$('#faceInfo').html('<strong>' + flipTo.substring(5).toUpperCase() + '</strong>' + '<span class="puzzleDate">' + date[flipTo.substring(5)] + '</span>');
};

$('#flipRight').click(function() {flipCube('right');});
$('#flipLeft').click(function() {flipCube('left');});
$('#flipUp').click(function() {flipCube('up');});
$('#flipDown').click(function() {flipCube('down');});