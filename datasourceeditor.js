var request = new XMLHttpRequest();
var schema={};
var editor;

request.onload = function() {
  if (request.status >= 200 && request.status < 400) {
    // Success!
    try {
      schema =  JSON.parse(request.responseText);
      afterSchemaLoad();
    } catch (e) {
      alert ("Problem loading schema: " + e.message);
    }

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

      
function afterSchemaLoad() { 
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
    });


  $("#jsonoutput").change(function() {
    editor.setValue(JSON.parse($("#jsonoutput").val()));
    $("#editor_holder").show();
  });
  
  // Hook up the validation indicator to update its 
  // status whenever the editor changes
  editor.on('change',function() {
    // Get an array of errors from the validator
    var errors = editor.validate();
    
    // Not valid
    if(errors.length) {
      alert("Error in the schema file.")
      console.log(errors);
    } else {
      
      $("#jsonoutput").val(JSON.stringify(editor.getValue(), null, 2));
    }
  });
}
$("#external-jsons li").click(function(e) {
  e.preventDefault();
  var url;
  targetname = e.target.textContent.trim();
  if  (targetname=='test-special') {
    url = 'https://gist.githubusercontent.com/stevage/08f89468f51822ade8d7/raw/191a4cb06ecf5089cd632f56140c2ec6f52df3c6/gistfile1.json';
  } else if (targetname == 'ganew') {
    url ='https://api.github.com/repos/NICTA/nationalmap/contents/wwwroot/init/ganew.json?ref=ga-datasource';
  } else {
    url = 'https://api.github.com/repos/NICTA/nationalmap/contents/wwwroot/init/' + targetname + '.json';
  }
  $.ajax({
      dataType: "json",
      url: url,
      accepts: { 'json': 'application/vnd.github.v3.raw'},
      success: loadedFile,
      error: function(e) { alert("Error " + e.status + ": " + e.statusText); }
  });
  $("#editor_holder").hide();
  $("#loading h2").text("Loading datasource file");
  $("#loading").show();

});
function loadedFile(t) {
    var catalog = t;
    $("#loading h2").text("Parsing datasource file"); // Doesn't seem to display in time...
    editor.setValue(catalog);
    $("#editor_holder").show();
    $("#loading").hide();
}

