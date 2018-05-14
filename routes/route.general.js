module.exports = function(app, swig, gestorBD) {
	
	//INICIO - GET vista
	app.get("/", function(req, res) {
		res.redirect("/login");
	});
	
};