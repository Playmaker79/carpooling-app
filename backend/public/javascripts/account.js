var patterns = {
    name : /^[a-zA-Z]{1,20}/,
    password:/^.{8,16}$/,
    email: /^([A-Z|a-z|0-9](\.|_){0,1})+[A-Z|a-z|0-9]\@([A-Z|a-z|0-9])+((\.){0,1}[A-Z|a-z|0-9]){2}\.[a-z]{2,3}$/
}
var validate = {
    verfiy_field: function(fieldset){
           if($(fieldset).children(".invalid_input").val() == undefined){
                $("#account_step1").slideUp("slow");
               $("#account_step2").slideDown("slow");
               return true
               
    }
        else{
            return false;
        }
    },
    get_string: function(element){
         return $('[name="' + element + '"]');
    },
    display_error: function(item,message){
        item.addClass("invalid_input");
        item.after('<span class="error_message">'+message+'</span>');
    },
    remove_error:function(item){
        $(item).addClass("valid_input");
        $(item).removeClass("invalid_input");
        $(item).next(".error_message").remove();
    },
    do: function (item,pattern,message){
        var item = this.get_string(item);
        var data = item.val();
        var pattern = new RegExp(pattern);
        if(pattern.test(data) == false ){
            if((item.next().hasClass("error_message") == false)){
            this.display_error(item,message);
            }

        }
        else{
            this.remove_error(item);
        }
    },
    confirm_password: function(password,confirm,message){
        var password  = this.get_string(password);
        var confirm = this.get_string(confirm);
        console.log(password.val());
        console.log(confirm.val());
        if(password.val()!==confirm.val()){
           if((confirm.next().hasClass("error_message") == false)){
            this.display_error(confirm,message);
            }
        }
        else{
            this.remove_error(confirm);
        }
    }
}
$(document).ready(function() {
    var verify2= null;
    var submit = $("#submit_button");
    submit.click(function(){
    validate.do("first_name",patterns.name,"Only Alphabets allowed, no special characters");
    validate.do("last_name",patterns.name,"Only Alphabets allowed, no special characters");
    validate.do("password",patterns.password,"Minimum 6 characters and maximum 18 character");
    validate.confirm_password("password","password_confirm","passwords do not match");
   var verify = validate.verfiy_field("#account_step1");
        if(verify == true && $("#account_step2").is(':visible')){
        console.log("yes22");
    validate.do("email_id",patterns.email,"Enter a valid Email address");
    validate.do("occupation",patterns.name,"Only Alphabets allowed, no special characters");
    verify2 = validate.verfiy_field("#account_step2");
        }
        if(verify==true&&verify2==true){
            $("#account_step1").slideDown();
            $("#account_step2").slideDown();
            $(submit).hide();
            $("#form_submit").show();
        }
    });
});
    
    