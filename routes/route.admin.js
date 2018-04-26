module.exports = function(app, swig, gestorBD) {
	//ADMIN nuevo serial - GET vista
	app.get("/admin", function(req, res) {
		var respuesta = swig.renderFile('web/views/registroSerial.html', {
			error: req.session.error
		});
		
		//Borrar futuras peticiones
		delete req.session.error;
		
		res.send(respuesta);
	});
	
	//ADMIN nuevo serial - POST procesar formulario
	app.post('/admin', function(req, res) {
		var criterio = { serial: req.body.serial };
		
		gestorBD.serials.obtenerSerials(criterio, function(serials) {
			//Serial aun no creado - OK
			if (serials === null || serials.length === 0) {
				var serial = {
					serial: req.body.serial,
					usuarios: 0,
					posicion: {
						A: 0, 
						B: 0
					},
					ultimoping: 0
				};
				
				gestorBD.serials.insertarSerial(serial, function(id) {
					if (id === null){
						req.session.error = {
							mensaje: 'Error al registrar serial. Inténtelo de nuevo más tarde',
							tipo: 'GENERAL'
						};
						res.redirect("/admin");
					} else {
						res.redirect("/");
					}
				});
			//Serial ya exite - WRONG
			}else{
				req.session.error = {
					mensaje: 'El serial \'' + req.body.serial + 
						'\' ya ha sido registrado',
					tipo: 'SERIAL'
				};
				
				res.redirect('/admin');
			}
		});
	});
};