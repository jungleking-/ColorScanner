let imgElement = document.getElementById('imageSrc');
let inputElement = document.getElementById('fileInput');

// paraameters
let enhance = 76.76;
let half = 7;
let width = 300;

let id = 1;
let lastFileName;

let rect = function(x, y, width, height) {
  return {
    x: x,
    y: y,
    width: width,
    height, height
  }
}

inputElement.addEventListener('change', (e) => {
  var file = e.target.files[0];
  lastFileName = file.name;
  imgElement.src = URL.createObjectURL(file);

  validation();
}, false);

function validation() {
  var disabled = true;
  if($("#label").val() != "" && $("#fileInput").prop("files").length > 0) {
    disabled = false;
  }

  $("#submitButton").prop("disabled", disabled);
}

$("#label").change(function() {
  validation();
});

$("#submitButton").click(function() {
  var resizeData = resize();

  // color clip
  var colorRect = rect(width / 2 - half, resizeData.height / 2 - half, half * 2, half * 2);
  var colorData = roi('colorCanvas', colorRect, resizeData.material);

  // white clip
  var whiteRect = rect(width / 2 - half, resizeData.height - half * 2, half * 2, half * 2);
  var whiteData = roi('whiteCanvas', whiteRect, resizeData.material);

  var value = concentration(colorData, whiteData);
  value = value * enhance;

  var viewData = {
    "date": new Date().toLocaleString('ja-JP', {era:'long'}),
    "fileName": lastFileName,
    "id": id,
    "value":  value.toFixed(1) + "mg",
    "resizeData": resizeData,
    "colorData": colorData,
    "whiteData": whiteData,
  }

  var tr = $("<tr></tr>");
  tr.append('<th scope="row">' + viewData.date + '</th>');
  tr.append('<td>' + viewData.fileName + '</td>');
  tr.append('<td><canvas id="debugOriginalCanvas' + viewData.id + '"></canvas>');
  tr.append('<td><canvas id="debugColorCanvas' + viewData.id + '"></canvas>');
  tr.append('<td><canvas id="debugWhiteCanvas' + viewData.id + '"></canvas>');
  tr.append('<td><div class="ext-end">' + viewData.value + '</canvas>');
  $("#colorMatchValues").append(tr);  

  var card = $("<div class='col'><div class='card'><div class='card-body'><h5 class='card-title'></h5><p class='card-text'></p></div><div class='card-footer'><small class='text-muted'>Last updated 3 mins ago</small></div></div></div>");
  $(card).find(".card").prepend("<canvas class='card-img-top' id='originalCanvas" + viewData.id + "' height='300'></canvas>");
  $(card).find(".card").append('<button type="button" class="btn btn-outline-danger deleteButton" data-mdb-ripple-color="dark">削除</button>');
  $(card).find(".card-title").html($("#label").val());
  $(card).find(".card-text").html(viewData.value);
  $(card).find(".deleteButton").click(function () {
      $(this).parent().parent().remove();
  })
  $("#cards").prepend(card);

  cv.imshow('originalCanvas' + id, viewData.resizeData.material);
  cv.imshow('debugOriginalCanvas' + id, viewData.resizeData.material);
  cv.imshow('debugColorCanvas' + id, viewData.colorData.material);
  cv.imshow('debugWhiteCanvas' + id, viewData.whiteData.material);

  $("#label").val("");
  $("#fileInput").val("");
  validation();
  
  id++;
});

function resize() {
  var src = cv.imread(imgElement);
  let aspect = src.size().width / width; 
  let height = src.size().height / aspect;
  if (src.size().width < width) {
    width = src.size().width;
    height = src.size().height;
  }
  let dsize = new cv.Size(width, height);
  var material = new cv.Mat();
  cv.resize(src, material, dsize, 0, 0, cv.INTER_AREA);
  src.delete();
  return {
    height: height,
    material: material
  }
}

function concentration(colorData, whiteData) {
  var rgbaTotalTable = rgbaTable(0, 0, 0, 0);
  rgbaTotalTable.r = colorData.rgbaColorTable.r / whiteData.rgbaColorTable.r; // 1
  rgbaTotalTable.b = colorData.rgbaColorTable.b / whiteData.rgbaColorTable.b; // 2
  rgbaTotalTable.g = colorData.rgbaColorTable.g / whiteData.rgbaColorTable.g; // 3
  var max = Math.max(rgbaTotalTable.r, rgbaTotalTable.g, rgbaTotalTable.b); // 4
  var min = Math.min(rgbaTotalTable.r, rgbaTotalTable.g, rgbaTotalTable.b); // 5
  var value = (max - min) / max;
  return value;
}

function roi(canvasId, rect, material) {
  var canvas = document.getElementById(canvasId);
	var context = canvas.getContext('2d', {willReadFrequently: true});
  let cvRect = new cv.Rect(rect.x, rect.y, rect.width, rect.height);
  var newMaterial = material.roi(cvRect);
  cv.imshow(canvasId, newMaterial);

  var rgbaColorTable = rgbaTable(0, 0, 0, 0);
  for (var x = 0; x < canvas.width; x++) {
    for (var y = 0; y < canvas.height; y++) {
      var imgData = context.getImageData(x, y, 1, 1);
      var rgba = imgData.data;
      rgbaColorTable.r += rgba[0];
      rgbaColorTable.g += rgba[1];
      rgbaColorTable.b += rgba[2];
      rgbaColorTable.count += 1;
    }
  }

  rgbaColorTable.r /= rgbaColorTable.count;
  rgbaColorTable.g /= rgbaColorTable.count;
  rgbaColorTable.b /= rgbaColorTable.count;  

  return {
    context: context,
    material: newMaterial,
    rgbaColorTable: rgbaColorTable
  };
}

function rgbaTable(r, g, b, count) {
  return {
    "r" : r,
    "g" : g,
    "b" : b,
    "count" : count,
  };
}

var Module = {
  onRuntimeInitialized() {}
};
