module.exports = {
	moment : null,
	init : function(moment){
		this.moment = moment;
	},
	unixtimezonenow : function(){
		//Offset al horario UTC (para espana)
		var offset = parseInt(this.moment().tz("Europe/Madrid").format('Z').split(':')[0]);
		
		var date = new Date();
		//Unixtime UTC
		var unixTimestampNow = Math.round(date.getTime()/1000);
		//Unixtime UTC + offset espana
		unixTimestampNow += offset * 60 * 60;
		
		return unixTimestampNow;
	}
};
