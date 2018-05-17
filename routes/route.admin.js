module.exports = function(app, swig, gestorBD, util) {
	
	//ADMIN(dashboard - ADMIN/SERIALS) - GET vista
	app.get("/admin/serials", function(req, res) {
		gestorBD.serials.obtenerSerials({}, function(serials){
			for (var i = 0; i < serials.length; i++) {
				serials[i].ultimopingformat = 
					util.moment(serials[i].ultimoping * 1000).tz('GMT').locale('es')
						.format("dddd, DD MMMM YYYY HH:mm");
			}
			
			var respuesta = swig.renderFile('web/views/admin.serials.html', {
				menu: "serials",
				serials: serials,
				success: req.session.success,
				successDelete: req.session.successDelete,
				errorDelete: req.session.errorDelete,
				error: req.session.error
			});
			
			//Borrar futuras peticiones
			delete req.session.error;
			delete req.session.success;
			delete req.session.errorDelete;
			delete req.session.successDelete;
			
			res.send(respuesta);
		});
	});
	
	//ADMIN(dashboard - ADMIN/USERS) - GET vista
	app.get("/admin/users", function(req, res) {
		gestorBD.usuarios.obtenerUsuarios({}, function(usuarios){
			var respuesta = swig.renderFile('web/views/admin.usuarios.html', {
				menu: "usuarios",
				usuarios: usuarios,
				successDelete: req.session.successDelete,
				error: req.session.error
			});
			
			//Borrar futuras peticiones
			delete req.session.error;
			delete req.session.successDelete;
			
			res.send(respuesta);
		});
	});
	
	//ADMIN(dashboard - ADMIN/PROFILE) - GET vista
	app.get("/admin/profile", function(req, res) {
		var respuesta = swig.renderFile('web/views/dashboard.perfil.html', {
			menu: "perfil",
			datosUsuario: req.session.usuario,
			error: req.session.error,
			success: req.session.success
		});
		
		//Borrar futuras peticiones
		delete req.session.error;
		delete req.session.success;
		
		res.send(respuesta);
	});
	
	//DASHBOARD(dashboard - ADMIN/SERIAL) - GET BORRAR serial
	app.get("/admin/serial/delete/:serial", function(req, res) {
		var criterio = { "serial" : req.params.serial };
		
		gestorBD.serials.obtenerSerials(criterio, function(serials){
			if (serials[0].usuarios > 0){
				req.session.errorDelete = "El serial '" + req.params.serial + "' no puede ser eliminado debido" + 
						" a que existen usuarios registrados con ese serial";
				res.redirect("/admin/serials");
			}else{
				gestorBD.serials.eliminarSerial(criterio, function(result){
					if (result === null){
						req.session.error = {
							mensaje: 'Inténtelo de nuevo más tarde',
							tipo: 'GENERAL'
						};
					}else{
						//Serial eliminado con exito
						req.session.successDelete = "Serial '" + req.params.serial + "' ELIMINADO con éxito";
					}
					res.redirect("/admin/serials");
				});
			}
		});
	});
	
	//DASHBOARD(dashboard - ADMIN/USER) - GET BORRAR usuario
	app.get("/admin/user/delete/:email/:serial", function(req, res) {
		var criterio = { "email" : req.params.email };
				
		gestorBD.usuarios.eliminarUsuario(criterio, function(result){
			if (result === null){
				req.session.error = {
					mensaje: 'Inténtelo de nuevo más tarde',
					tipo: 'GENERAL'
				};
				res.redirect("/admin/users");
			}else{
				var criterio = { "serial": req.params.serial };
				
				gestorBD.serials.obtenerSerials(criterio, function(serials){
					if (result === null){
						req.session.error = {
							mensaje: 'Inténtelo de nuevo más tarde',
							tipo: 'GENERAL'
						};
						res.redirect("/admin/users");
					}else{
						//Restamos 1 a los usuarios registrado con el serial del usuario eliminado
						serials[0].usuarios--;
						
						gestorBD.serials.modificarSerial(criterio, serials[0], function(result) {
							if(result === null){
								req.session.error = {
									mensaje: 'Inténtelo de nuevo más tarde',
									tipo: 'GENERAL'
								};
								res.redirect("/admin/users");
							}else{
								//Usuario eliminado con exito
								req.session.successDelete = "Usuario con Email '" + 
									req.params.email + "' ELIMINADO con éxito";
								res.redirect("/admin/users");
							}
						});
					}
				});
			}
		});
	});
	
	//ADMIN(ADMIN/SERIAL) - POST añadir nuevo serial
	app.post('/admin/serial', function(req, res) {
		var criterio = { serial: req.body.serial };
		
		gestorBD.serials.obtenerSerials(criterio, function(serials) {
			//Serial aun no creado - RIGHT
			if (serials === null || serials.length === 0) {
				var serial = {
					serial: req.body.serial,
					usuarios: 0,
					posicion: {
						A: 0, 
						B: 0
					},
					ultimoping: 0,
					emailsnotificacion: ["", ""],
					idstelegram: [],
					tratamiento: {
						A: {
							medicamento: "Nolotil",
							pastillas: 12
						},
						B: {
							medicamento: "Paracetamol",
							pastillas: 12
						}
					},
					toma: {
						tiempoespera: 3,
						irdeteccion: true,
						btnconfirmacion: true
					},
					dispensador: {
						lednotificacion: true,
						sonidonotificacion: {
							estado: true,
							valor: 5
						}
					},
					configuracionnotificaciones: {
						sinconexion: {
							estado: true,
							valor: 5
						},
						pocaspastillas: {
							estado: true,
							valor: 1
						},
						temperatura: {
							estado: true,
							min: 15,
							max: 30
						},
						humedad: {
							estado: true,
							min: 20,
							max: 85
						},
						detecciongas: true,
						deteccioncaida: true
					}
				};
				
				gestorBD.serials.insertarSerial(serial, function(id) {
					if (id === null){
						req.session.error = {
							mensaje: 'Error al registrar serial. Inténtelo de nuevo más tarde',
							tipo: 'GENERAL'
						};
						res.redirect("/admin/serials");
					} else {
						//Serial insertado con exito
						req.session.success = "Serial '" + req.body.serial + "' INSERTADO con éxito";
						res.redirect("/admin/serials");
					}
				});
			//Serial ya exite - WRONG
			}else{
				req.session.error = {
					mensaje: "El serial '" + req.body.serial + "' ya ha sido registrado",
					tipo: 'SERIAL'
				};
				
				res.redirect('/admin/serials');
			}
		});
	});
	
	/*
	 * ADMIN(PERFIL) - POST datos personales de admin
	 * app.post('/profile'... en route.dashboard.js
	 */
};