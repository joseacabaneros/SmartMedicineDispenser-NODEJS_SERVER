module.exports = {
	mongo : null,
	app : null,
	init : function(app, mongo){
		this.mongo = mongo;
		this.app = app;
	},
	insertarSerial: function(serial, funcionCallback){
		this.mongo.MongoClient.connect(this.app.get('db'), function(err, db){
			if(err){
				funcionCallback(null);
			}else{
				var collection = db.collection('serials');
				collection.insert(serial, function(err, result){
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
	obtenerSerials: function(criterio, funcionCallback){
		this.mongo.MongoClient.connect(this.app.get('db'), function(err, db){
			if(err){
				funcionCallback(null);
			}else{
				var collection = db.collection('serials');
				collection.find(criterio).toArray(function(err, serials){
					if(err){
						funcionCallback(null);
					}else{
						funcionCallback(serials);
					}
					db.close();
				});
			}
		});
	},
	modificarSerial: function(criterio, serial, funcionCallback){
		this.mongo.MongoClient.connect(this.app.get('db'), function(err, db){
			if(err){
				funcionCallback(null);
			}else{
				var collection = db.collection('serials');
				collection.update(criterio, {$set: serial}, function(err, result){
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
	eliminarSerial: function(criterio, funcionCallback) {
		this.mongo.MongoClient.connect(this.app.get('db'), function(err, db) {
			if (err) {
				funcionCallback(null);
			} else {
				var collection = db.collection('serials');
				collection.remove(criterio, function(err, result) {
					if (err) {
						funcionCallback(null);
					} else {
						funcionCallback(result);
					}
					db.close();
				});
			}
		});
	}
};