$(document).ready(function() {

	status('Choose a sound file to upload.');

	// Check to see when a user has selected a file
	var timerId;
	timerId = setInterval(function() {
		var filename = $('#soundFileInput').val();
		if(isValidSoundFile(filename)) {
			clearInterval(timerId);

			$('#soundUploadForm').submit();
			$('#soundFileInput').enable(false);
		}
	}, 500);

	function isValidSoundFile(filename) {
		// add other criterion
		return filename !== '';
	}

	$('#soundUploadForm').bind('submit', function(e) {
		e.preventDefault(); // <-- important
		status('Munching the sound bytes ...');

		$(this).ajaxSubmit({

			error: function(xhr) {
				status('Error: ' + xhr.status);
			},

			success: function(response) {
				if(response.error) {
					status('We have a problem...');
					return;
				}

				status('File successfully uploaded: ' + response.path);
			}
		});

		// Have to stop the form from submitting and causing
		// a page refresh - don't forget this
		return false;
	});

	function status(message) {
		$('#status').text(message);
	}
});
