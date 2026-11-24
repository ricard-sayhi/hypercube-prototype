var myChart;
var graphData;

$(document).ready(function(){
	$('.selectpicker').selectpicker('val', []);

	$(document).on('click', ".clickrow", function(){
		if (graphData !== undefined) {
			graphData = undefined;
		}

		if ($(this).closest('.row_holder').find('#graphbox').length){
			if ($('#graphbox').is(":visible")){
				$('#graphbox').hide();
				return;
			}
			else {
				$('#graphbox').show();
			}
		}
		$('#graphbox').hide();

		$(this).closest('.row_holder').append($('#graphbox'));
		
		$.ajax({
			type: "POST",
			url: "include/get_teamhistory.php",
			data: {
				teamid: $(this).data('rowid'),
				cteam: $(this).data('team'),
				ttd: $(this).data('ttd')
			},
			success: function(output){
				graphData = $.parseJSON(output);
				createChart();
			}
		});
	});
	
	$(document).on('change', "#yearsgraph", function(){
		createChart();
	});

	$(document).on('keyup', "#gsearch", function(){
		filter_rows();
	});
	$(document).on('change', '#leaguefilter', function(){
		filter_rows();
	});
});

function createChart(){
	if (graphData === undefined) {
		return;
	}

	var partialData = graphData;
	if ($('#yearsgraph').is(":checked")) {
		let yesteryear = new Date(new Date().setFullYear(new Date().getFullYear() - 1));
		partialData = graphData.filter(el => 
			new Date(el.d_Date) > yesteryear
		);
	}
	
	if (myChart !== undefined) {
		myChart.destroy();
	}
	$.when(
		myChart = new Chart(
			$('#wci_evolution'),
			{
				type: 'line',
				data: {
					labels: partialData.map(row => row.d_Date),
					datasets: [{
							label: 'WCI',
							data: partialData.map(row => row.WCI),
							fill: false,
							borderColor: '#0000ff',
							tension: 0.1
						}
					]
				},
				options: {
					interaction: {
						intersect: false,
						mode: 'index'
					},
					animation: {
						duration: 0
					}
				}
			}
		)
	).then(
		$('#graphbox').show(0),
		myChart.resize()
	);
}

function filter_rows(){
	let searchstr = $("#gsearch").val();
	let league_filter = $("#leaguefilter").val();
	
	$('#ranking_body .row_holder').hide();
	$('#ranking_body .row_holder').each(function() {
		if ($(this).find('.row.clickrow').data('team').toUpperCase().indexOf(searchstr.toUpperCase()) !== -1 || searchstr.length == 0) { 
			if (typeof(league_filter) == 'undefined' || league_filter.length == 0 || league_filter.includes(String($(this).find('.row.clickrow').data('compid')))){
				$(this).show();
			}
		}
	});
}