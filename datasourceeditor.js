var schema={};
var catalog={};
var editor;


$(function() {
  var schemafile;
  $.getJSON('Catalog.json', afterSchemaLoad)
  .fail(function(jqxhr, status, error) { 
    alert('Couldn\'t access schema file "catalog.json": \n' + error) ;
  });
  $('.row .btn').on('click', function(e) {
    e.preventDefault();
    var $this = $(this);
    var $collapse = $this.closest('.collapse-group').find('.collapse');
    $collapse.collapse('toggle');
    });

});

      
function afterSchemaLoad(json) { 
    // Initialize the editor
    schema = json;

    JSONEditor.defaults.iconlibs.mybootstrap = JSONEditor.AbstractIconLib.extend({
      mapping: {
        collapse: 'resize-small',
        expand: 'resize-full',
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

    var alwaysname = { 
      compile: function() {
        return function (vars) {
          return vars.self.name;
        }
      }
    };


    editor = new JSONEditor(document.getElementById('editor_holder'),{
      // Enable fetching schemas via ajax
      ajax: true,
      keep_oneof_values: false, // See https://github.com/jdorn/json-editor/issues/398
      
      // The schema for the editor
      schema: schema,//{ $ref: "schema2.json" },
      //remove_empty_properties: true,
      //theme: "foundation5",
      theme: "bootstrap3",
      template: 'default',//alwaysname, // soooo much faster than the default template engine as long as we only use it for this.
      iconlib: "mybootstrap", 
      disable_edit_json: true
    });
    editor.on('ready', function() {
      $("#nm-jsons").show();
    });


  $("#jsonoutput").change(function() {
    var t;
    try {
      t = JSON.parse($("#jsonoutput").val());
    } catch (e) {
      alert("There's a syntax problem with your JSON code. \n\n" + e.message);
      return;
    }

    var performance = window.performance;
    var t0 = performance.now();
    var errors = editor.validate(t);
    if(errors.length) {
      // errors is an array of objects, each with a `path`, `property`, and `message` parameter
      // `property` is the schema keyword that triggered the validation error (e.g. "minLength")
      // `path` is a dot separated path into the JSON object (e.g. "root.path.to.field")
      var msg ="There's a problem with your JSON code. \n\n";
      for (var i =0; i < errors.length; i++) {
        msg += '[' + errors[i].path + '] ' + errors[i].message + '\n';
      }
      alert(msg);
      console.log(JSON.stringify(errors,null,2));
    }
    else {
      console.log("Validation ok in " + ((performance.now() - t0)/1000).toFixed(1) + " seconds.");
    }


    $("#loading h2").text("Parsing datasource file"); // Doesn't seem to display in time...

    var t0 = performance.now();
    editor.setValue(t);
    console.log("Loaded in " + ((performance.now() - t0)/1000).toFixed(1) + " seconds.");
    $("#editor_holder").show();
    $("#loading").hide();
    $("#savejson").show();
    $("#editor_holder")[0].scrollIntoView();


  });
  
  // Hook up the validation indicator to update its 
  // status whenever the editor changes
  editor.on('change',function() {
    // Get an array of errors from the validator
    var errors = editor.validate();
    
    // Not valid
    if(errors.length) {
      // probably not an issue, validation errors are shown already.
      // alert("Error in the schema file.")
      // console.log(JSON.stringify(errors,null,2));
    } else {
      //if (!$("#loading").is(":visible"))
        $("#jsonoutput").val(JSON.stringify(editor.getValue(), null, 2));
    }
  });

  populateSources();
}

function clickedExternalJson(e) {
  e.preventDefault();
  var url;
  targetname = e.target.textContent.trim();
  // Need to go through Github API or else CORS issues. 
  if ($(e.target).data("url")) {
    url = $(e.target).data("url");
  } else if  (targetname=='test-special') {
    url = 'https://gist.githubusercontent.com/stevage/08f89468f51822ade8d7/raw/ced603a2dd6c4dd8664751bc45915a45f493dcbf/gistfile1.json';
  } else if (targetname == 'ganew') {
    url ='https://api.github.com/repos/NICTA/nationalmap/contents/wwwroot/init/ganew.json?ref=ga-datasource';
  } else if (targetname == 'aremi') {
    url = 'https://api.github.com/repos/NICTA/aremi-natmap/contents/wwwroot/init/aremi.json';
  } else if (targetname == '(blank)') {
    //url = 'https://gist.github.com/4092eda0d9b6a54ca839';
    loadedFile({catalog:[]});
    //$("#jsonoutput").trigger("change");
    return;
  } else {
    url = 'https://api.github.com/repos/NICTA/nationalmap/contents/wwwroot/init/' + targetname + '.json';
  }

  $("#sourceurl").val(url);
  return;
}

$("#nm-jsons li").click(clickedExternalJson);
$("#other-jsons li").click(clickedExternalJson);


//https://api.github.com/gists/08f89468f51822ade8d7

$("#loadjson").click(clickLoadJSON);

// Possibly alter the current URL target, then load it.
function clickLoadJSON(e) {
  e.preventDefault();
  url = $("#sourceurl").val().trim()
  if (url.match('^https:\/\/gist.github.com')) {
    // handle loading user-friendly Gist URLs by looking up raw url first - we grab the first file.
    var newurl = url.replace(/^https:\/\/gist\.github\.com(\/[^\/]+(?=\/.))?/, 'https://api.github.com/gists');
    $.getJSON(newurl, null, function(j) {
      var f = j.files;
      var raw_url = j.files[Object.keys(j.files)[0]].raw_url;
      loadURL(raw_url);

    });
  } else {
    loadURL(url);
  }
}

// Retrieve the URL specified, then trigger loading.
function loadURL(url) {
   $.ajax({
      dataType: "json",
      url: url,
      accepts: { 'json': 'application/vnd.github.v3.raw'},
      success: loadedFile,
      error: function(e) { alert("Error " + e.status + ": " + e.statusText); }
  });
  $("#editor_holder").hide();
  $("#loadingmsg").html("<h2>Loading datasource</h2>Large files may take a very long time. Really.");
  $("#loading").show();

}

// We have received file, put it in the JSON edit box, which will trigger parsing.
function loadedFile(t, status, request) {
    console.log(request);
    if (request !== undefined) {
      var remaining = request.getResponseHeader('X-RateLimit-Remaining');
      if (remaining !== null && Number(remaining) <= 5) {
        alert("GitHub limits file requests to 60 per hour. You only have " + remaining + " left. When they run out, you'll need to wait for a bit, " +
        "or manually copy/paste the source file in.");
      }
    }
    $("#jsonoutput").val(JSON.stringify(t,null,2));
    $("#jsonoutput").trigger("change");
    return;
    
}

// Use the list of data sources in the National Map Github repo to make a list of clickable targets.
function populateSources() {
  var appendtarget = "#nm-jsons";

  function loadDataSourceList(url) {
    $.ajax({
        dataType: "json",
        url: url,
        accepts: { 'json': 'application/vnd.github.v3.raw'},
        error: function(e) { alert("Error " + e.status + ": " + e.statusText); },
        success: loadedList
    });

  }

  function loadedList(j) {
    j.forEach(function(e) {
      if (e.url.match(/\.json/)) {
        //https://rawgit.com/NICTA/nationalmap/6756f1a1304722b27ff2553a2eb64bfed9dcf212/datasources/000_settings.json
        // html_url: https://github.com/NICTA/nationalmap/blob/master/datasources/000_settings.json
        // use rawgit to save Github requests
        // thought we could use the sha, but it's not the right sha?
        var url = 'https://rawgit.com/NICTA/nationalmap/master' + '/' + e.path;
        $(appendtarget).append($(
          "<li><a href='#' data-url='" + url + "'" +
            ">" + 
            e.name.replace('.json','')
            .replace(/^\d\d_/, '')
            .replace(/^\d\d_/, '') // catch 00_01_names
            .replace(/_/g, ' ')
            .replace('000 settings', 'General settings') +
            "</a>" +
            (e.name.match('00_National_Data_Sets') ? ' <ul id="nm-jsons-national"></ul> ' : '') +
             "</li>"
        ));
      }

    });
    $("#nm-jsons li").click(clickedExternalJson);
    console.log(j);
    if (appendtarget === "#nm-jsons") {
      $(appendtarget).append('<li>National Data Sets<ul id="nm-jsons-national"></ul></li>');
      appendtarget='#nm-jsons-national';
      loadDataSourceList('https://api.github.com/repos/NICTA/nationalmap/contents/datasources/00_National_Data_Sets');
    }
  };

  $("#nm-jsons").html("");

  var source = 'https://api.github.com/repos/NICTA/nationalmap/contents/datasources';

  // for testing, to reduce wasting Github API calls
  if (false) { source = 'https://gist.githubusercontent.com/stevage/d2aef2fddd7e24e305e5/raw/gistfile1.txt'; }
  loadDataSourceList(source);

}

$("#savejson").click(function(e) {
  function savedGist(j) {
    var raw_url = j.files[Object.keys(j.files)[0]].raw_url;
    var cleanpreviewurl = 'http://nationalmap.research.nicta.com/#clean&' + encodeURIComponent(raw_url);
    var previewurl = 'http://nationalmap.research.nicta.com/#' + encodeURIComponent(raw_url);
    $("#loadingmsg").html('<h2>Saved!</h2>' + 
      '<p><a target="_blank" href="' + cleanpreviewurl + '">Preview your changes in National Map</a></p>' +
      '<p>If you\'re happy with your changes, you can: ' + 
      '<ul><li> Send this URL to the person who manages your TerriaJS server: <a target="_blank" href="' + j.html_url + '">' + j.html_url + '</a></li>' + 
      '<li><a id="downloadfile" href="#">Download the datasource file</a>.</li>' +
      '</li>'
      );
    $("#loading").show();
    $("#downloadfile").click(function(e) {
      saveTextAs($("#jsonoutput").val(), 'datasource.json');
    });
    console.log(j);
    //$("#sourceurl").val(
  }
  //e.preventDefault();
  var t = JSON.stringify(editor.getValue(),null,2);
  var f = {
    description: 'Modified data source file',
    'public': false,
    files: {
      'datasource.json': { // extract actual filename
        'content': t
      }
    }
  };
  $("#loadingmsg").html("<h2>Saving datasource</h2>Saving a copy of your file...");
  $("#loading").show();
  $.post('https://api.github.com/gists', JSON.stringify(f), savedGist, 'json');
});

