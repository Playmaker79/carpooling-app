

$/*('.delete-ride').on('click', function () {
    var deleteRide = function(id){
     var request = $.ajax({
            url:'/rides/'+id,
            type: 'delete',
            contentType:false
        });

        request.fail(function (xhr, status, errorThrown ) {
            if(xhr.status == 409){
                toastr.clear();
                toastr["error"]("You already have a vechicle with that number.Please make sure to add unique numbers", "Oops !");
            }
            else if(xhr.status == 500){
                toastr.clear();
                toastr["error"]("You have missed some fields! please fill them out.", "Missing fields !");
            }
            else{

            }
        });
        request.done(function (data) {
            toastr.clear();
            toastr["success"]("The ride is deleted!");

        });

    }

   var ride_id =  $(this).closest("tr").attr("data-ride");
   if(ride_id !== null){
      var prompt = confirm("Are you sure you want to delete ?");
            if(prompt == true){
               deleteRide(ride_id);
            }
            else{

            }
          }

});
*/

$('.delete-ride').on('click', function () {
    function deleteRide(id,ride_row){
        var request = $.ajax({
            type:'DELETE',
            url: '/rides/'+id,
            cache: false,
            processData: false
        });

        request.fail(function (xhr, status, errorThrown ) {
            switch(xhr.status){
                case 0:
                    toastr.clear();
                    toastr["warning"]("Oops! something went wrong.Please check your connection", "Something went wrong !");
                    break;
                case 500:
                    toastr.clear();
                    toastr["error"]("our server is experiencing some connection  problems please try again later!",
                        "Something went wrong!");
                    break;
                case 401:
                    toastr.clear();
                    toastr["warning"]("You have logged out! please login to continue");
                case 400:
                    toastr.clear();
                    toastr["error"]("Unable to delete the ride,Please check whether it exist ");
                default :
                    toastr.clear();
                    toastr["error"]("Ahh! cannot delete the ride","something went wrong");
            }
        });

        request.done(function (data,textStatus, xhr) {
            toastr.clear();
            toastr.success('The ride has been deleted', 'Success');
            ride_row.remove();
        });
    }

    var ride_id =  $(this).closest("tr").attr("data-ride");
    var ride_row= $(this).closest("tr");
    if(ride_id !== null){
        var prompt = confirm("The ride will be deleted,are you sure?");
        if(prompt == true){
            deleteRide(ride_id,ride_row);
        }
    }

});
