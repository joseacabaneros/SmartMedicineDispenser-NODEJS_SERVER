module.exports = function(app, swig, gestorBD) {
	
	//REGISTRO de usuario - GET vista
	app.get("/signup", function(req, res) {
		
		var respuesta = swig.renderFile('web/views/registroUsuario.html', {
			error: req.session.error,
			datos: req.session.datos
		});
		
		//Borrar futuras peticiones
		delete req.session.error;
		delete req.session.datos;
		
		res.send(respuesta);
	});

	//REGISTRO de usuario - POST procesar formulario de registro
	app.post('/signup', function(req, res) {
		var pass1 = req.body.password;
		var pass2 = req.body.password2;
		
		//Comprobar contraseñas iguales
		if(pass1 !== pass2){
			req.session.error = {
				mensaje: 'Las contraseñas introducidas no coinciden',
				tipo: 'PASSWORD'
			};
			
			req.session.datos = {
				serial: req.body.serial,
				nombre: req.body.nombre,
				apellido: req.body.apellido,
				telefono: req.body.tlfn,
				email: req.body.email
			};
			
			res.redirect('/signup');
		}else{
			//Comprobar que el email no esté ya registrado
			var criterio = { email: req.body.email };
			
			gestorBD.usuarios.obtenerUsuarios(criterio, function(usuarios) {
				//Email no registrado - OK
				if (usuarios === null || usuarios.length === 0) {
					var criterio = { key: req.body.serial };
					
					gestorBD.obtenerSerials(criterio, function(serials) {
						//Serial no creado - WRONG
						if (serials === null || serials.length === 0) {
							req.session.error = {
								mensaje: 'El serial \'' + req.body.serial + 
									'\' no corresponde con ningún dispensador',
								tipo: 'SERIAL'
							};
							
							req.session.datos = {
								nombre: req.body.nombre,
								apellido: req.body.apellido,
								telefono: req.body.tlfn,
								email: req.body.email
							};
							
							res.redirect('/signup');
							
						//Serial creado - OK
						}else{
							//Solo se permite el registro de 2 usuarios por serial - WRONG
							if(serials[0].usuarios === 2){
								req.session.error = {
									mensaje: 'Error al registrar usuario. Número máximo de ' + 
										'usuarios registrados con el serial \'' + serials[0].key + '\'',
									tipo: 'GENERAL'
								};
								res.redirect("/signup");
							//Menos de 2 usuarios con el serial - OK
							}else{
								var passcrypt = app.get("crypto").createHmac('sha256', app.get('clave'))
					    		.update(req.body.password).digest('hex');
				
								var usuario = {
									serial: req.body.serial,
									nombre: req.body.nombre,
									apellido: req.body.apellido,
									telefono: req.body.tlfn,
									tipo: 'USUARIO',
									email: req.body.email,
									password: passcrypt
								};
								
								gestorBD.usuarios.insertarUsuario(usuario, function(id) {
									if (id === null){
										req.session.error = {
											mensaje: 'Error al registrar usuario. Inténtelo de nuevo más tarde',
											tipo: 'GENERAL'
										};
										res.redirect("/signup");
									} else {
										//Anadir un usuario mas como registrado con el serial
										serials[0].usuarios++;
										gestorBD.modificarSerial(criterio, serials[0], function(result) {
											if(result === null){
												req.session.error = {
													mensaje: 'Error al registrar usuario. Inténtelo de nuevo más tarde',
													tipo: 'GENERAL'
												};
												res.redirect("/signup");
											}else{
												req.session.success = 'Usuario registrado con éxito';
												res.redirect("/login");
											}
										});
									}
								});
							}
						}
					});
					
				//Email ya registrado - WRONG
				} else {
					req.session.error = {
						mensaje: 'La dirección de correo electrónico \'' + req.body.email + 
							'\' ya ha sido registrada',
						tipo: 'EMAIL'
					};
					
					req.session.datos = {
						serial: req.body.serial,
						nombre: req.body.nombre,
						apellido: req.body.apellido,
						telefono: req.body.tlfn
					};
					
					res.redirect('/signup');
				}
			});
		}
	});
	
	//LOGIN de usuario - GET vista
	app.get("/login", function(req, res) {
		var respuesta = swig.renderFile('web/views/login.html', {
			success: req.session.success,
			error: req.session.error
		});
		
		//Borrar futuras peticiones
		delete req.session.success;
		delete req.session.error;
		
		res.send(respuesta);
	});

	//LOGIN de usuario - POST procesar datos de formulario de login
	app.post("/login", function(req, res) {
		var seguro = app.get("crypto").createHmac('sha256', app.get('clave'))
				.update(req.body.password).digest('hex');

		var criterio = {
			email : req.body.email,
			password : seguro
		};

		gestorBD.usuarios.obtenerUsuarios(criterio, function(usuarios) {
			if (usuarios === null || usuarios.length === 0) {
				req.session.usuario = null;
				
				req.session.error = 'El email y la contraseña introducidos no son correctos';
				res.redirect("/login");
			} else {
				req.session.usuario = usuarios[0];
	
				var tipousuario = usuarios[0].tipo;
				if(tipousuario === "USUARIO"){
					res.redirect("/dashboard/pillbox/A");
				}else{
					res.redirect("/admin");
				}
			}
		});
	});
	
	//LOGOUT de usuario - POST boton cerrar sesion
	app.post('/logout', function (req, res) {
		//Borrar usuario de la sesion
		delete req.session.usuario;
		
	    res.redirect("/");
	});
	
};
