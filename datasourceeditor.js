var request = new XMLHttpRequest();
var schema={};
var editor;




request.onload = function() {
  if (request.status >= 200 && request.status < 400) {
    // Success!
    schema =  JSON.parse(request.responseText);
    afterLoad();

} else {
    alert ("Couldn't access schema.");
  }
};

request.onerror = function() {
    alert ("Couldn't access schema.");
};

$(function() {
  request.open('GET', 'catalog.json', true);
  request.send();
});

      
function afterLoad() { 
    // Initialize the editor

    JSONEditor.defaults.iconlibs.mybootstrap = JSONEditor.AbstractIconLib.extend({
      mapping: {
        collapse: 'chevron-down',
        //expand: 'pencil',
        "delete": 'remove',
        edit: 'pencil',
        add: 'plus',
        cancel: 'floppy-remove',
        save: 'floppy-saved',
        moveup: 'arrow-up',
        movedown: 'arrow-down'
      },
      icon_prefix: 'glyphicon glyphicon-'
    });


    //JSONEditor.defaults.editors.options = {};
    //JSONEditor.defaults.editors.options.checkbox = true;
    editor = new JSONEditor(document.getElementById('editor_holder'),{
      // Enable fetching schemas via ajax
      ajax: true,
      keep_oneof_values: false, // See https://github.com/jdorn/json-editor/issues/398
      
      // The schema for the editor
      schema: schema,//{ $ref: "schema2.json" },
      //theme: "foundation5",
      theme: "bootstrap3",
      iconlib: "mybootstrap", 
      disable_edit_json: true
      
      // Seed the form with a starting value
      //startval: starting_value,
      
      // Disable additional properties
      //no_additional_properties: true,
      
      // Require all properties by default
      //required_by_default: true
    });

  // Hook up the submit button to log to the console
  /*
  $("#submit").click(function() {
    // Get the value from the editor
    $("#jsonoutput").val(JSON.stringify(editor.getValue(), null, 2));
    $("#jsonoutput").show();
  });
  
  $("#load").click(function() {
    editor.setValue(JSON.parse($("#jsonoutput").val()));
  });*/

  $("#jsonoutput").change(function() {
    editor.setValue(JSON.parse($("#jsonoutput").val()));
    $("#editor_holder").show();
  });
  
  // Hook up the validation indicator to update its 
  // status whenever the editor changes
  editor.on('change',function() {
    // Get an array of errors from the validator
    var errors = editor.validate();
    
    var indicator = document.getElementById('valid_indicator');
    
    // Not valid
    if(errors.length) {
      indicator.style.color = 'red';
      indicator.textContent = "not valid";
      console.log(errors);
    }
    // Valid
    else {
      indicator.style.color = 'green';
      indicator.textContent = "valid";
      $("#jsonoutput").val(JSON.stringify(editor.getValue(), null, 2));
    }
  });
}
$("#external-jsons li").click(function(e) {
  e.preventDefault();
  var url;
  targetname = e.target.textContent.trim();
  if  (targetname='text-special') {
    url = 'https://gist.githubusercontent.com/stevage/08f89468f51822ade8d7/raw/191a4cb06ecf5089cd632f56140c2ec6f52df3c6/gistfile1.json';
  } else {
    url = 'https://api.github.com/repos/NICTA/nationalmap/contents/wwwroot/init/' + targetname + '.json';
  }
  $.ajax({
      dataType: "json",
      url: url,
      accepts: { 'json': 'application/vnd.github.v3.raw'},
      success: loadedFile
  });
  $("#editor_holder").hide();
  $("#loading").show();
});
function loadedFile(t) {
    //var t = CryptoJS.enc.Base64.stringify(CryptoJS.enc.Base64.parse(d.content).words);
    //var t = decodeBase64(d.content);
    var catalog = t;

    editor.setValue(catalog);
    $("#editor_holder").show();
    $("#loading").hide();
}

