$(document).ready(function(){
	$('.btn-programacion').css('margin-bottom', '70px');
	
	//Refrescar pagina cada 5 minutos
	setInterval(function() {
		window.location.reload();
	}, 300000); 
	
	//Colores huecos pastillero
	$('.past-pos-tomada').css("fill", "#FB3838");
	$('.past-pos-programada').css("fill", "#58ACFA");
	$('.past-pos-no-disponible').css("fill", "#1A5276");
	$('.past-pos-libre').css("fill", "#16CC4A");
	
	//Boton de confimacion de 'Borrar'
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
			var min = moment().startOf('minute').add(2, 'minutes');
    		//var min = moment().startOf('minute');
			$('#input-time').data("DateTimePicker").minDate(min);
			$('#input-time input').val(moment().startOf('minute').add(2, 'minutes').format("HH:mm"));
		}else
			$('#input-time').data("DateTimePicker").minDate(false);
    });
	
    $('#input-time').datetimepicker({
        locale: 'es',
        format: 'HH:mm',
        minDate: moment().startOf('minute').add(2, 'minutes'),
        ignoreReadonly: true,
        allowInputToggle: true
    });
    $('#input-time input').val("");
    
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
    	
    	changeResume();
    });
    
    $('#select-rep, #input-pastillas').change(function() {
    	changeResume();
    });
});

function changeResume(){
	var rep = parseInt($('#select-rep option:selected').text());
	var tomas = parseInt($('#input-tomas').val());
	
	if(rep > 0 && tomas > 0){
		var pastillas = parseInt($('#input-pastillas').val()) * tomas;
		
		var seconds = parseInt(rep * tomas * 60 * 60, 10);
		var days = Math.floor(seconds / (3600*24));
		seconds  -= days*3600*24;
		var hrs   = Math.floor(seconds / 3600);
		seconds  -= hrs*3600;
		
		$('.resumeProgramacion').html("<span>Tratamiento de </span><b>" + days 
				+ " días</b> y <b>" + hrs + " horas</b> | <b>" + pastillas + 
				" pastillas</b>");
		$('blockquote').show();
	}else{
		$('blockquote').hide()
	}
}

function doProgressWidth(tomadas, programadas, libres, tratamiento) {
	var tomadasWidth = Math.round(tomadas * 100 / tratamiento);
	var programadasWidth = Math.round(programadas * 100 / tratamiento);
	var libresWidth = Math.round(libres * 100 / tratamiento);
	
	
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