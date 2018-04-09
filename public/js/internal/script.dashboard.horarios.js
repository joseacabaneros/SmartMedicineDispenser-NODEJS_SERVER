$(document).ready(function(){
	$('[data-toggle=confirmation]').confirmation({
	  rootSelector: '[data-toggle=confirmation]',
	  btnOkLabel: "Sí",
	  btnOkClass: "btn-xs btn-primary",
	  btnCancelClass: "btn-xs btn-default"
	});

	//Fecha y hora (coordinacion)
	$('#input-date').datetimepicker({
        locale: 'es',
        format: 'DD/MM/YYYY',
        minDate: moment().startOf('day'),
        ignoreReadonly: true,
        allowInputToggle: true
    }).on('dp.change', function(e) {
    	if(e.date && e.date.isSame(moment(), 'd')){
			//var min = moment().add(5, 'minute').startOf('minute');
    		var min = moment().startOf('minute');
			$('#input-time').data("DateTimePicker").minDate(min);
		}else
			$('#input-time').data("DateTimePicker").minDate(false);
    });
	
    $('#input-time').datetimepicker({
        locale: 'es',
        format: 'HH:mm',
        minDate: moment().add(5, 'minute').startOf('minute'),
        useCurrent: false,
        ignoreReadonly: true,
        allowInputToggle: true
    });
    
    //Repeticion y tomas (coordinacion)
    $('#input-tomas').change(function(){
    	var rep = parseInt($('#select-rep option:selected').text());
    	var tomas = parseInt($('#input-tomas').val());
    	if(tomas > 1 && rep === 0)
    		$('#select-rep option').filter(function() { 
		        return ($(this).text() == '8'); //To select 8
		    }).prop('selected', true);
    	else if(tomas === 1)
    		$('#select-rep').val('0');
    });
});

function doProgressWidth(tomadas, programadas, libres) {
	var tomadasWidth = Math.round(tomadas * 100 / 12);
	var programadasWidth = Math.round(programadas * 100 / 12);
	var libresWidth = Math.round(libres * 100 / 12);
	
	
	//Tamano de las progress bars
    $('.progress-bar-danger').width(tomadasWidth + '%');
    $('.progress-bar-info').width(programadasWidth + '%');
    $('.progress-bar-success').width(libresWidth + '%');
}

//Repeticion y tomas (coordinacion)
function changeSelectRep(libresPasSelec, libresPasOtro, pastilleroSelect){
	var rep = parseInt($('#select-rep option:selected').text());
	var tomas = parseInt($('#input-tomas').val());
	if(rep > 0 && tomas === 1)
		$('#input-tomas').val(2);
	else if(rep === 0)
		$('#input-tomas').val(1);
	
	checkMax(libresPasSelec, libresPasOtro, pastilleroSelect);
}

function checkMax(libresPasSelec, libresPasOtro, pastilleroSelect){
	var pastillero = $("#select-pastillero").val();
	var pastillas = $("#input-pastillas").val();
	var tomas = $("#input-tomas").val();
	
	var btnProg = $("#button-programar");
	var alert = $(".div--alert_programacion");

	//Programacion para el pastillero A
	if(pastillero === "A"){
		var libresA = (pastilleroSelect === "A") ? libresPasSelec : libresPasOtro;
		if(pastillas * tomas > libresA){
			btnProg.prop('disabled', true);
			alert.show();
		}else{
			btnProg.prop('disabled', false);
			alert.hide();
		}
	//Programacion para el pastillero B
	}else if(pastillero === "B"){
		var libresB = (pastilleroSelect === "B") ? libresPasSelec : libresPasOtro;
		if(pastillas * tomas > libresB){
			btnProg.prop('disabled', true);
			alert.show();
		}else{
			btnProg.prop('disabled', false);
			alert.hide();
		}
	//Programacion para ambos pastilleros A y B
	}else if(pastillero === "X"){
		var min = Math.min(libresPasSelec, libresPasOtro);
		if(pastillas * tomas > min){
			btnProg.prop('disabled', true);
			alert.show();
		}else{
			btnProg.prop('disabled', false);
			alert.hide();
		}
	}
}

function changeViewMobile(){
	$('.pastilleros').toggle();
	$('.programacion').toggle();
	
	if ($('.programacion').is(':visible')) {
		$('.btn-programacion').html('<i class="fas fa-chevron-left"></i>');
	} else {
		$('.btn-programacion').html('<i class="far fa-calendar-alt"></i>');
	}
}