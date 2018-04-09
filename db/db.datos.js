module.exports = {
	mongo : null,
	app : null,
	init : function(app, mongo){
		this.mongo = mongo;
		this.app = app;
	},
	insertarDato: function(dato, funcionCallback){
		this.mongo.MongoClient.connect(this.app.get('db'), function(err, db){
			if(err){
				funcionCallback(null);
			}else{
				var collection = db.collection('datos');
				collection.insert(dato, function(err, result){
					if(err){
						funcionCallback(null);
					}else{
						funcionCallback(result.ops[0]._id);
					}
					db.close();
				});
			}
		});
	},
	obtenerDatos: function(criterio, funcionCallback){
		this.mongo.MongoClient.connect(this.app.get('db'), function(err, db){
			if(err){
				funcionCallback(null);
			}else{
				var collection = db.collection('datos');
				collection.find(criterio).sort( { unixtime: 1 } ).toArray(function(err, datos){
					if(err){
						funcionCallback(null);
					}else{
						funcionCallback(datos);
					}
					db.close();
				});
			}
		});
	},
	actualizarDato: function(criterio, dato, funcionCallback){
		this.mongo.MongoClient.connect(this.app.get('db'), function(err, db){
			if(err){
				funcionCallback(null);
			}else{
				var collection = db.collection('datos');
				collection.update(criterio, {$set: dato}, function(err, result){
					if(err){
						funcionCallback(null);
					}else{
						funcionCallback(result);
					}
					db.close();
				});
			}
		});
	},
};