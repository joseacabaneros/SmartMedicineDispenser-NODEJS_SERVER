module.exports = function(app, swig, gestorBD) {
	
	//DASHBOARD(HORARIOS) - GET vista
	app.get("/dashboard", function(req, res) {
		var respuesta = swig.renderFile('web/views/dashboard.horarios.html', {
			menu: "horarios"
		});
		res.send(respuesta);
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
				res.redirect("/dashboard");
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
				
				gestorBD.insertarProgramacion(horario, notInsert);
			}
		});
		
		res.redirect("/dashboard");
	});
};