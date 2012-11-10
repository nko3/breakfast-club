/*
 * GET home page.
 */

exports.index = function(req, res){
	//Strip out port number
	var hostname = ( req.headers.host.match(/:/g) ) ? req.headers.host.slice( 0, req.headers.host.indexOf(":") ) : req.headers.host;
	hostname = 'http://' + hostname;
	res.render('index', { title: 'Express', host: hostname});
};