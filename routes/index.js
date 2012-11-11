/*
 * GET home page.
 */

exports.index = function(req, res){
	if (req.isAuthenticated()) {
		res.render('index', { title: 'Express', host: hostname});
	}
	else {
		res.redirect('/users');
	}
};