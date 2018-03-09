$(document).ready(function(){
	$("#serial").mask("*****-*****-*****-*****-*****", {
		placeholder : " "
	});
	
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
        format: 'LT',
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
    
    
    
    //Fecha y hora del SEGUNDO pastillero
    $('#date2').datetimepicker({
        locale: 'es',
        format: 'DD/MM/YYYY',
        minDate: moment().startOf('day')
    }).on('dp.change', function(e) {
    	if(e.date && e.date.isSame(moment(), 'd')){
			var min = moment().add(5, 'minute').startOf('minute');
			$('#time2').data("DateTimePicker").minDate(min);
		}else
			$('#time2').data("DateTimePicker").minDate(false);
    });

    $('#time2').datetimepicker({
        locale: 'es',
        format: 'LT',
        minDate: moment().add(5, 'minute').startOf('minute')
    });
    
    //Repeticion y tomas de SEGUNDO pastillero
    $('#rep2').change(function(){
    	var rep2 = parseInt($('#rep2 option:selected').text());
    	var tomas2 = parseInt($('#tomas2').val());
    	if(rep2 > 0 && tomas2 === 1)
    		$('#tomas2').val(2);
    	else if(rep2 === 0)
    		$('#tomas2').val(1);
    });
    
    $('#tomas2').change(function(){
    	var rep2 = parseInt($('#rep2 option:selected').text());
    	var tomas2 = parseInt($('#tomas2').val());
    	if(tomas2 > 1 && rep2 === 0)
    		$('#rep2 option').filter(function() { 
		        return ($(this).text() == '8'); //To select 8
		    }).prop('selected', true);
    	else if(tomas2 === 1)
    		$('#rep2').val('0');
    });
});