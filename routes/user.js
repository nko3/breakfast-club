
/*
 * GET users listing.
 */

exports.list = function(req, res){
  res.render('login', { title: 'Express', message: ''});
};