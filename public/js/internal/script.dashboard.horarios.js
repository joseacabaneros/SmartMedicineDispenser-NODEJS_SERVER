$(document).ready(function(){

	//Fecha y hora del PRIMER pastillero
	$('#date1').datetimepicker({
        locale: 'es',
        format: 'DD/MM/YYYY',
        minDate: moment().startOf('day')
    }).on('dp.change', function(e) {
    	if(e.date && e.date.isSame(moment(), 'd')){
			//var min = moment().add(5, 'minute').startOf('minute');
    		var min = moment().startOf('minute');
			$('#time1').data("DateTimePicker").minDate(min);
		}else
			$('#time1').data("DateTimePicker").minDate(false);
    });

    $('#time1').datetimepicker({
        locale: 'es',
        format: 'HH:mm',
        minDate: moment().add(5, 'minute').startOf('minute')
    });
    
    //Repeticion y tomas de PRIMER pastillero
    $('#rep1').change(function(){
    	var rep1 = parseInt($('#rep1 option:selected').text());
    	var tomas1 = parseInt($('#tomas1').val());
    	if(rep1 > 0 && tomas1 === 1)
    		$('#tomas1').val(2);
    	else if(rep1 === 0)
    		$('#tomas1').val(1);
    });
    
    $('#tomas1').change(function(){
    	var rep1 = parseInt($('#rep1 option:selected').text());
    	var tomas1 = parseInt($('#tomas1').val());
    	if(tomas1 > 1 && rep1 === 0)
    		$('#rep1 option').filter(function() { 
		        return ($(this).text() == '8'); //To select 8
		    }).prop('selected', true);
    	else if(tomas1 === 1)
    		$('#rep1').val('0');
    });
});

function doProgressWidth(tomadas, programadas) {
	var libres = 12 - tomadas - programadas;
	
	var tomadasWidth = Math.round(tomadas * 100 / 12);
	var programadasWidth = Math.round(programadas * 100 / 12);
	var libresWidth = Math.round(libres * 100 / 12);
	
	
	//Tamano de las progress bars
    $('.progress-bar-danger').width(tomadasWidth + '%');
    $('.progress-bar-info').width(programadasWidth + '%');
    $('.progress-bar-success').width(libresWidth + '%');
}