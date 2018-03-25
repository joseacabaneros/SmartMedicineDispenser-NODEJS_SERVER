module.exports = function(app, swig, gestorBD, util) {
	
	//DASHBOARD(PASTILLEROS/HORARIOS) - GET vista
	app.get("/dashboard/pillbox/:pastillero", function(req, res) {
		//Obtener posicion actual del pastillero A
		var criterio = { "key" : req.session.usuario.serial };
		
		var pastilleroLet = req.params.pastillero;
		var pastilleroNum = ((pastilleroLet === "A") ? '1' : '2'); //A o B
		
		gestorBD.serials.obtenerSerials(criterio, function(serial){
			var criterio = {
				serial: req.session.usuario.serial,
				pastillero: pastilleroNum,
				unixtime: { $gte: util.unixtimezonenow() }
			};
			
			//Obtener siguientes horarios programados
			gestorBD.horarios.obtenerProgramacion(criterio, function(horarios){
				var horariosForDate = [];
				
				horarios.forEach(function(h){
					var horarioAux = {
						fecha: util.moment(h.unixtime * 1000).tz('GMT').locale('es')
							.format("dddd DD MMMM YYYY"),
						hora: util.moment(h.unixtime * 1000).tz('GMT').locale('es')
							.format("HH:mm"),
						pastillas: h.pastillas,
						id: h._id
					};
					
					horariosForDate.push(horarioAux);
				});
				
				//Clases para pintar los colores correspondientes en el pastillero SVG
				var clasesSvg = [];
				var cont = 0;
				//Pastillas tomadas
				for(var i = 0 ; i < serial[0].posicion[pastilleroLet]; i++){
					clasesSvg[cont] = "past-pos-tomada";
					cont++;
				}
				//Pastillas programadas
				for(i = 0 ; i < horariosForDate.length; i++){
					clasesSvg[cont] = "past-pos-programada";
					cont++;
				}
				//Pastillas libres (sin programar y sin tomar)
				for(i = 0 ; i < (12-serial[0].posicion[pastilleroLet]-horariosForDate.length); i++){
					clasesSvg[cont] = "past-pos-libre";
					cont++;
				}
				
				var respuesta = swig.renderFile('web/views/dashboard.horarios.html', {
					menu: "horarios",
					pastillero: pastilleroLet,
					posicion: serial[0].posicion[pastilleroLet],
					horarios: horariosForDate,
					clasessvg: clasesSvg
				});
				res.send(respuesta);
			});
		});
	});
	
	//DASHBOARD(DISPENSADOR) - GET vista
	app.get("/dashboard/dispenser", function(req, res) {
		var respuesta = swig.renderFile('web/views/dashboard.dispensador.html', {
			menu: "dispensador"
		});
		res.send(respuesta);
	});
	
	//DASHBOARD(PERFIL) - GET vista
	app.get("/dashboard/profile", function(req, res) {
		var respuesta = swig.renderFile('web/views/dashboard.perfil.html', {
			menu: "perfil"
		});
		res.send(respuesta);
	});
	
	//DASHBOARD(AJUSTES) - GET vista
	app.get("/dashboard/settings", function(req, res) {
		var respuesta = swig.renderFile('web/views/dashboard.ajustes.html', {
			menu: "ajustes"
		});
		res.send(respuesta);
	});
	
	//DASHBOARD - POST programacion horarios
	app.post('/dashboard', function (req, res) {
		var usuarioSession = req.session.usuario;
		
		var formHorario = {
			pastillero: req.body.pastillero,
			date: req.body.datepicker,
			time: req.body.timepicker,
			pastillas: req.body.pastillas,
			rep: parseInt(req.body.rep),
			tomas: parseInt(req.body.tomas)
		};
		
		//Calculo del UNIXtime de programacion del horario
		var parts = formHorario.date.split('/');
		var dateISOstring = parts[2] + "-" + parts[1] + "-" + parts[0] + "T" + formHorario.time + ":00"; 
		console.log(dateISOstring);
		var unixTimestamp = Math.round(new Date(dateISOstring).getTime()/1000);
		console.log(unixTimestamp);
		
		var pastilleros = [];
		//Pastillero x = programacion tanto para el pastillero 1 como para el 2
		if(formHorario.pastillero === "x"){
			pastilleros = ["1","2"];
		}else{
			pastilleros = [formHorario.pastillero];
		}
		
		function notInsert(id) {
			if (id === null){
				req.session.error = {
					mensaje: 'Error al programar horario. Inténtelo de nuevo más tarde',
					tipo: 'GENERAL'
				};
				res.redirect("/dashboard/pillbox/A");
			}
		}
		
		pastilleros.forEach(function(pastillero) {
			for(var i = 0; i < formHorario.tomas; i++){
				var sumUnixTime = (i * formHorario.rep * 3600) + unixTimestamp;
				
				var horario = {
					serial: usuarioSession.serial,
					unixtime: sumUnixTime,
					pastillero: pastillero,
					pastillas: formHorario.pastillas,
					tomadaBtn: false,
					tomadaIR: false
				};
				
				gestorBD.horarios.insertarProgramacion(horario, notInsert);
			}
		});
		
		//Redirecionar flujo al pastillero programado
		if(pastilleros[0] === "2"){
			res.redirect("/dashboard/pillbox/B");
		}else{
			res.redirect("/dashboard/pillbox/A");
		}
	});
};