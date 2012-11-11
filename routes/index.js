/*
 * GET home page.
 */

exports.index = function(req, res){
	if (req.isAuthenticated()) {
		res.render('index', { title: 'Express', user: req.user});
	}
	else {
		res.redirect('/users');
	}
};