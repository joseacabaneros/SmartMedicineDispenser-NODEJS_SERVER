module.exports = {
	mongo: null,
	init : function(app, mongo){
		this.mongo = mongo;
		
		this.usuarios.init(app, mongo);
		this.serials.init(app, mongo);
		this.horarios.init(app, mongo);
		this.datos.init(app, mongo);
	},
	usuarios: require("../db/db.usuarios.js"),
	serials: require("../db/db.serials.js"),
	horarios: require("../db/db.horarios.js"),
	datos: require("../db/db.datos.js")
};
