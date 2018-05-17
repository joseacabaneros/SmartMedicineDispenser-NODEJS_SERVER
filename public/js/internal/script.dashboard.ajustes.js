$(document).ready(function() {
	//Toma de Medicación
	$('input[type=radio][name=deteccion]').change(function() {
        if (this.value === 'no' && 
        		($('input[type=radio][name=btnConfirmacion]:checked').val() === 'no')) {
        	$("input[type=radio][name=btnConfirmacion][value='si']").prop("checked", true);
        }
    });
	
	$('input[type=radio][name=btnConfirmacion]').change(function() {
        if (this.value === 'no' && 
        		($('input[type=radio][name=deteccion]:checked').val() === 'no')) {
        	$("input[type=radio][name=deteccion][value='si']").prop("checked", true);
        }
    });
	
	//Sonido
	if($('input[type=radio][name=sonidoNotificacionEstado]:checked').val() === 'no'){
		$("#inputSonido").prop('disabled', true);
	}
	
    $('input[type=radio][name=sonidoNotificacionEstado]').change(function() {
        if (this.value === 'si') {
        	$("#inputSonido").prop('disabled', false);
        	$("#inputSonido").val("5");
        }
        else if (this.value === 'no') {
        	$("#inputSonido").prop('disabled', true);
        	$("#inputSonido").val("");
        }
    });
    
    //Notificaciones "sin conexion"
	if($('input[type=radio][name=sinConexionEstado]:checked').val() === 'no'){
		$("#inputSinConexion").prop('disabled', true);
	}
    
    $('input[type=radio][name=sinConexionEstado]').change(function() {
        if (this.value === 'si') {
        	$("#inputSinConexion").prop('disabled', false);
        	$("#inputSinConexion").val("5");
        }
        else if (this.value === 'no') {
        	$("#inputSinConexion").prop('disabled', true);
        	$("#inputSinConexion").val("");
        }
    });
    
    //Notificaciones "pocas pastillas"
	if($('input[type=radio][name=pocasPastillasEstado]:checked').val() === 'no'){
		$("#inputPocasPastillas").prop('disabled', true);
	}
    
    $('input[type=radio][name=pocasPastillasEstado]').change(function() {
        if (this.value === 'si') {
        	$("#inputPocasPastillas").prop('disabled', false);
        	$("#inputPocasPastillas").val("1");
        }
        else if (this.value === 'no') {
        	$("#inputPocasPastillas").prop('disabled', true);
        	$("#inputPocasPastillas").val("");
        }
    });
    
    //Notificaciones "temperatura"
	if($('input[type=radio][name=temperaturaEstado]:checked').val() === 'no'){
		$("#inputTemperaturaMin").prop('disabled', true);
		$("#inputTemperaturaMax").prop('disabled', true);
	}
    
    $('input[type=radio][name=temperaturaEstado]').change(function() {
        if (this.value === 'si') {
        	$("#inputTemperaturaMin").prop('disabled', false);
    		$("#inputTemperaturaMax").prop('disabled', false);
        	$("#inputTemperaturaMin").val("15");
        	$("#inputTemperaturaMax").val("30");
        }
        else if (this.value === 'no') {
        	$("#inputTemperaturaMin").prop('disabled', true);
    		$("#inputTemperaturaMax").prop('disabled', true);
        	$("#inputTemperaturaMin").val("");
        	$("#inputTemperaturaMax").val("");
        }
    });
    
  //Notificaciones "humedad"
	if($('input[type=radio][name=humedadEstado]:checked').val() === 'no'){
		$("#inputHumedadMin").prop('disabled', true);
		$("#inputHumedadMax").prop('disabled', true);
	}
    
    $('input[type=radio][name=humedadEstado]').change(function() {
        if (this.value === 'si') {
        	$("#inputHumedadMin").prop('disabled', false);
    		$("#inputHumedadMax").prop('disabled', false);
        	$("#inputHumedadMin").val("20");
        	$("#inputHumedadMax").val("85");
        }
        else if (this.value === 'no') {
        	$("#inputHumedadMin").prop('disabled', true);
    		$("#inputHumedadMax").prop('disabled', true);
        	$("#inputHumedadMin").val("");
        	$("#inputHumedadMax").val("");
        }
    });
});