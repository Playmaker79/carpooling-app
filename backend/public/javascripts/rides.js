$('.delete-ride').on('click', function () {
   function deleteRide(id){
     //Ajax call for delete
   }

   var ride_id =  $(this).closest("tr").attr("data-ride");
   if(ride_id !== null){
      var prompt = confirm("Are you sure you want to delete ?");
            if(prompt == true){
               toastr.success('The ride has been deleted', 'Success');
               deleteRide(1);
            }
            else{

            }
          }

});

