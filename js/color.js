let imgElement = document.getElementById('imageSrc');
let inputElement = document.getElementById('fileInput');

// paraameters
let enhance = 76.76;
let half = 7;
let width = 300;

let id = 1;
let lastFileName;
let source;

inputElement.addEventListener('change', (e) => {
  var file = e.target.files[0];
  lastFileName = file.name;
  imgElement.src = URL.createObjectURL(file);
}, false);

imgElement.onload = function() {
  var src = cv.imread(imgElement);

  var hsvReport = [];
  for (var i = 0; i < 255; i++) {
    hsvReport.push(0);
  }

  var src2 = src.clone();
  let dst = new cv.Mat();
  let aspect = src.size().width / width; 
  let height = src.size().height / aspect;
  if (src.size().width < width) {
    width = src.size().width;
    height = src.size().height;
  }
  let dsize = new cv.Size(width, height);
  cv.resize(src, src2, dsize, 0, 0, cv.INTER_AREA);

  let rect = new cv.Rect(width / 2 - half, height / 2 - half, half * 2, half * 2);
  var tri_src = src2.roi(rect);

  cv.imshow('colorCanvas', tri_src.clone());

  let src3 = new cv.Mat();
  src3 = src2.clone();
  var colorCanvas = document.getElementById('colorCanvas');
	var colorCanvas_ctx = colorCanvas.getContext('2d', {willReadFrequently: true});

  console.log(rect)

  var rgba_color_total_table = {
    "r" : 0,
    "g" : 0,
    "b" : 0,
    "count" : 0,
  };

  for (var x = 0; x < colorCanvas.width; x++) {
    for (var y = 0; y < colorCanvas.height; y++) {
      var imgData = colorCanvas_ctx.getImageData(x, y, 1, 1);
      var rgba = imgData.data;
      rgba_color_total_table.r += rgba[0];
      rgba_color_total_table.g += rgba[1];
      rgba_color_total_table.b += rgba[2];
      rgba_color_total_table.count += 1;
    }
  }

  rgba_color_total_table.r /= rgba_color_total_table.count;
  rgba_color_total_table.g /= rgba_color_total_table.count;
  rgba_color_total_table.b /= rgba_color_total_table.count;
  
  var rgba_white_total_table = {
    "r" : 0,
    "g" : 0,
    "b" : 0,
    "count" : 0,
  };

  var whiteCanvas = document.getElementById('whiteCanvas');
	var whiteCanvas_ctx = whiteCanvas.getContext('2d', {willReadFrequently: true});

  let white_dst = new cv.Mat();
  let rect_white = new cv.Rect(width / 2 - half, height - half * 2, half * 2, half * 2);
  var white_src = src2.roi(rect_white);
  cv.imshow('whiteCanvas', white_src.clone());


  for (var x = 0; x < whiteCanvas.width; x++) {
    for (var y = 0; y < whiteCanvas.height; y++) {
      var imgData = whiteCanvas_ctx.getImageData(x, y, 1, 1);
      var rgba = imgData.data;
      rgba_white_total_table.r += rgba[0];
      rgba_white_total_table.g += rgba[1];
      rgba_white_total_table.b += rgba[2];
      rgba_white_total_table.count += 1;
    }
  }

  rgba_white_total_table.r /= rgba_white_total_table.count;
  rgba_white_total_table.g /= rgba_white_total_table.count;
  rgba_white_total_table.b /= rgba_white_total_table.count;

  var rgba_total_table = {
    "r" : 0,
    "g" : 0,
    "b" : 0,
    "count" : 0,
  };

  rgba_total_table.r = rgba_color_total_table.r / rgba_white_total_table.r; // 1
  rgba_total_table.b = rgba_color_total_table.b / rgba_white_total_table.b; // 2
  rgba_total_table.g = rgba_color_total_table.g / rgba_white_total_table.g; // 3

  var max = Math.max(rgba_total_table.r, rgba_total_table.g, rgba_total_table.b); // 4
  var min = Math.min(rgba_total_table.r, rgba_total_table.g, rgba_total_table.b); // 5

  var value = (max - min) / max;
  value = value * enhance;

  var colorMatchHTML = "";
  var tr = document.createElement("tr");
  tr.appendChild((function() {
    var th = document.createElement("th");
    th.setAttribute("scope", "row");
    th.innerHTML = new Date().toLocaleString('ja-JP', {era:'long'});
    return th;
  })());
  tr.appendChild((function() {
    var td = document.createElement("td");
    td.innerHTML = lastFileName;
    return td;
  })());
  tr.appendChild((function() {
    var td = document.createElement("td");
    var canvas = document.createElement("canvas");
    canvas.setAttribute("id", "original_canvas" + id);
    td.appendChild(canvas);
    return td;
  })());
  tr.appendChild((function() {
    var td = document.createElement("td");
    var canvas = document.createElement("canvas");
    canvas.setAttribute("id", "colorCanvas" + id);
    td.appendChild(canvas);
    return td;
  })());
  tr.appendChild((function() {
    var td = document.createElement("td");
    var canvas = document.createElement("canvas");
    canvas.setAttribute("id", "whiteCanvas" + id);
    td.appendChild(canvas);
    return td;
  })());
  tr.appendChild((function() {
    var td = document.createElement("td");
    var div = document.createElement("div");
    div.setAttribute("class", "ext-end");
    div.innerHTML = value.toFixed(1) + "g";
    td.appendChild(div);
    return td;
  })());
  
  document.getElementById("colorMatchValues").prepend(tr);
  cv.imshow('original_canvas' + id, src3);
  cv.imshow('colorCanvas' + id, tri_src);
  cv.imshow('whiteCanvas' + id, white_src);

  id++;
};

function morphologyEx(src) {
  var dst = new cv.Mat();
  const kernelSize = cv.Mat.ones(5, 5, cv.CV_8U);
  cv.morphologyEx(src, dst, cv.MORPH_CLOSE, kernelSize);
  return dst;
}

var Module = {
  onRuntimeInitialized() {
    document.getElementById('status').innerHTML = 'OpenCV.js is ready.';
  }
};
