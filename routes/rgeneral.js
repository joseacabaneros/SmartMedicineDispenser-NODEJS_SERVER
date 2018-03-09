module.exports = function(app, swig, gestorBD) {
	
	//PORTADA - GET vista
	app.get("/", function(req, res) {
		var respuesta = swig.renderFile('web/views/portada.html', {});
		res.send(respuesta);
	});
};