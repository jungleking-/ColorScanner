let imgElement = document.getElementById('imageSrc');
let inputElement = document.getElementById('fileInput');

// paraameters
let enhance = 76.76;
let half = 7;
let width = 300;

let id = 1;
let lastFileName;
let source;

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
}, false);

imgElement.onload = function() {
  var src = cv.imread(imgElement);
  var src2 = src.clone();
  let aspect = src.size().width / width; 
  let height = src.size().height / aspect;
  if (src.size().width < width) {
    width = src.size().width;
    height = src.size().height;
  }
  let dsize = new cv.Size(width, height);
  cv.resize(src, src2, dsize, 0, 0, cv.INTER_AREA);

  var colorRect = rect(width / 2 - half, height / 2 - half, half * 2, half * 2);
  var colorData = roi('colorCanvas', colorRect, src2);

  var whiteRect = rect(width / 2 - half, height - half * 2, half * 2, half * 2);
  var whiteData = roi('whiteCanvas', whiteRect, src2);

  var rgbaTotalTable = rgbaTable(0, 0, 0, 0);

  rgbaTotalTable.r = colorData.rgbaColorTable.r / whiteData.rgbaColorTable.r; // 1
  rgbaTotalTable.b = colorData.rgbaColorTable.b / whiteData.rgbaColorTable.b; // 2
  rgbaTotalTable.g = colorData.rgbaColorTable.g / whiteData.rgbaColorTable.g; // 3

  var max = Math.max(rgbaTotalTable.r, rgbaTotalTable.g, rgbaTotalTable.b); // 4
  var min = Math.min(rgbaTotalTable.r, rgbaTotalTable.g, rgbaTotalTable.b); // 5

  var value = (max - min) / max;
  value = value * enhance;

  var viewData = {
    "date": new Date().toLocaleString('ja-JP', {era:'long'}),
    "fileName": lastFileName,
    "id": id,
    "value":  value.toFixed(1) + "mg"    
  }

  var tr = document.createElement("tr");
  tr.appendChild((function() {
    var th = document.createElement("th");
    th.setAttribute("scope", "row");
    th.innerHTML = viewData.date;
    return th;
  })());
  tr.appendChild((function() {
    var td = document.createElement("td");
    td.innerHTML = viewData.lastFileName;
    return td;
  })());
  tr.appendChild((function() {
    var td = document.createElement("td");
    var canvas = document.createElement("canvas");
    canvas.setAttribute("id", "original_canvas" + viewData.id);
    td.appendChild(canvas);
    return td;
  })());
  tr.appendChild((function() {
    var td = document.createElement("td");
    var canvas = document.createElement("canvas");
    canvas.setAttribute("id", "colorCanvas" + viewData.id);
    td.appendChild(canvas);
    return td;
  })());
  tr.appendChild((function() {
    var td = document.createElement("td");
    var canvas = document.createElement("canvas");
    canvas.setAttribute("id", "whiteCanvas" + viewData.id);
    td.appendChild(canvas);
    return td;
  })());
  tr.appendChild((function() {
    var td = document.createElement("td");
    var div = document.createElement("div");
    div.setAttribute("class", "ext-end");
    div.innerHTML = viewData.value;
    td.appendChild(div);
    return td;
  })());
  
  document.getElementById("colorMatchValues").prepend(tr);
  cv.imshow('original_canvas' + id, src2);
  cv.imshow('colorCanvas' + id, colorData.material);
  cv.imshow('whiteCanvas' + id, whiteData.material);

  id++;
};

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
  onRuntimeInitialized() {
  }
};
