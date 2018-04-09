//*****************************  MÓDULOS  ****************************
var express = require('express');
var app = express();
app.use(express.static('public'));

//Sesion
var expressSession = require('express-session');
app.use(expressSession({
    secret: 'abcdefg',
    resave: true,
    saveUninitialized: true
}));

//Encriptar password usuario
var crypto = require('crypto');

//???
var rest = require('request');
app.set('rest',rest); 

//Base de datos MongoDB
var mongo = require('mongodb');
var gestorBD = require("./db/db.gestor.js");
gestorBD.init(app, mongo);

//Swig - HTML dinamico y distribuido 
var swig = require('swig');

//Parser de formularios
var bodyParser = require('body-parser');
app.use(bodyParser.json()); 
app.use(bodyParser.urlencoded({ extended: true })); 

//Control de usos horarios
var moment = require('moment-timezone');

//Control de usos horarios
var util = require("./util/util.js");
util.init(moment);
//*******************************************************************


//*****************************  ROUTER  ****************************
//RouterUSUARIOSession
var routerUsuarioSession = express.Router(); 
routerUsuarioSession.use(function(req, res, next){
	//console.log("routerUsuarioSession");
	var usuario = req.session.usuario;
	if(usuario !== undefined && usuario.tipo === "USUARIO"){
		next();
	}else{
		res.redirect("/login");
	}
});
//Aplicar RouterUSUARIOSession
app.use("/dashboard", routerUsuarioSession);

//RouterADMINSession
var routerAdminSession = express.Router(); 
routerAdminSession.use(function(req, res, next){
	 //console.log("routerAdminSession");
	 var usuario = req.session.usuario;
	 if(usuario !== undefined && usuario.tipo === "ADMIN"){
		 next();
	 }else{
		 res.redirect("/login");
	 }
});
//Aplicar RouterADMINSession
app.use("/admin", routerAdminSession);
//*******************************************************************


//*****************************  VARIABLES  *************************
app.set('port', 8081);
app.set('db','mongodb://localhost:27017/prueba');
app.set('clave','abcdefg');
app.set('crypto',crypto);
//*******************************************************************


//*****************************  RUTAS  *****************************
//Controladores por lógica
require("./routes/route.usuarios.js")(app, swig, gestorBD);
require("./routes/route.admin.js")(app, swig, gestorBD);
require("./routes/route.general.js")(app, swig, gestorBD);
require("./routes/route.dashboard.js")(app, swig, gestorBD, util);
//API REST de acceso por el 
require("./api/api.get.js")(app, gestorBD, util);
require("./api/api.post.js")(app, gestorBD);
//*******************************************************************


//*******************  MANEJO DE EXCEPCIONES  ***********************
app.use(function (err, req, res, next) {
    console.log("Error producido: " + err); //we log the error in our db
    if (! res.headersSent) { 
        res.status(400);
        res.send("Recurso no disponible");
    }
});
//********************************************************************


app.listen(app.get('port'), function() {
	console.log("Servidor activo");
});