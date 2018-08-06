//////////////////////////////////////////////////////////////////////
 // *
 // *	gl.js
 // *
 // *	this module is webgl map canvas related.
 // *
//////////////////////////////////////////////////////////////////////


(function(){

const vsSource = `
attribute vec4 aVertexPosition;
attribute vec2 aTextureCoord;

uniform mat4 uComponentOffsetMatrix;
uniform mat4 uTileOffsetMatrix;
uniform mat4 uModelViewMatrix;
uniform mat4 uProjectionMatrix;

varying highp vec2 vTextureCoord;

void main(void) {
	gl_Position = uProjectionMatrix * uModelViewMatrix * uTileOffsetMatrix * uComponentOffsetMatrix * aVertexPosition;//
	vTextureCoord = aTextureCoord;
}
`;

  // Fragment shader program

const fsSource = `
varying highp vec2 vTextureCoord;

uniform sampler2D uSampler;

void main(void) {
	gl_FragColor = texture2D(uSampler, vTextureCoord);
}
`;
const tileTextureArray = new Float32Array([
    0.0,  0.0,
    1.0,  0.0,
    1.0,  1.0,
    0.0,  1.0,
  ]);

//
// creates a shader of the given type, uploads the source and
// compiles it.
//
function loadShader(gl, type, source) {
  const shader = gl.createShader(type);

  // Send the source to the shader object
  gl.shaderSource(shader, source);

  // Compile the shader program
  gl.compileShader(shader);

  // See if it compiled successfully
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    alert('An error occurred compiling the shaders: ' + gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }

  return shader;
}

function initShaderProgram(gl, vsSource, fsSource) {
  const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
  const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);

  // Create the shader program

  const shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.linkProgram(shaderProgram);

  // If creating the shader program failed, alert
  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    alert('Unable to initialize the shader program: ' + gl.getProgramInfoLog(shaderProgram));
    return null;
  }

  return shaderProgram;
}

//
// initBuffers
//
// Initialize the buffers we'll need. For this demo, we just
// have one object -- a simple two-dimensional square.
//
function initBuffers(gl) {

  // Create a buffer for the square's positions.

  const positionBuffer = gl.createBuffer();

  // Select the positionBuffer as the one to apply buffer
  // operations to from here out.
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

  // Now create an array of positions for the square.
  // 
  const positions = [
     0.0,  0.0,
     256,  0.0,
     256,  256,
     0.0,  256,
  ];
  
  // Now pass the list of positions into WebGL to build the
  // shape. We do this by creating a Float32Array from the
  // JavaScript array, then use it to fill the current buffer.
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

  const textureCoordBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, textureCoordBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, tileTextureArray, gl.STATIC_DRAW);


  // const indexBuffer = gl.createBuffer();
  // gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);

  // // This array defines each face as two triangles, using the
  // // indices into the vertex array to specify each triangle's
  // // position.

  // const indices = [0,  1,  2,  0,  3,  2];

  // // Now send the element array to GL
  // gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);

  return {
    position: positionBuffer,
    textureCoord: textureCoordBuffer,
    // indices: indexBuffer,
  };
}

function genTextureCoord(rct, w, h) {
	var x = rct.x / w, y = 1-rct.y / h, x1 = (rct.x+rct.w)/w, y1 = 1-(rct.y+rct.h)/h;
	// return new Float32Array([
	// 	0,  0,
	// 	1,  0,
	// 	1,  0.5,
	// 	0,  0.5,
	// ]);

	return new Float32Array([
		x,  y1,
		x1,  y1,
		x1,  y,
		x,  y,
	]);
}

	TMap.Canvas.MapCanvasGL.prototype.glInit = function() {
		var gl = this.gl;
		if (gl == null || this.glShaderInfo != null)
			return null;

		const shader = initShaderProgram(gl, vsSource, fsSource);
		if (shader == null)
			return null; 

		const buffers = initBuffers(gl);

		this.glShaderInfo = {
			program: shader,
			attribLocations: {
				vertexPosition: gl.getAttribLocation(shader, 'aVertexPosition'),
				textureCoord: gl.getAttribLocation(shader, 'aTextureCoord'),
			},
			uniformLocations: {
				projectionMatrix: gl.getUniformLocation(shader, 'uProjectionMatrix'),
				modelViewMatrix: gl.getUniformLocation(shader, 'uModelViewMatrix'),
				tileMatrix: gl.getUniformLocation(shader, 'uTileOffsetMatrix'),
				componentMatrix: gl.getUniformLocation(shader, 'uComponentOffsetMatrix'),
				uSampler: gl.getUniformLocation(shader, 'uSampler'),
			},
			buffers: buffers,
		};

		this._cur =0;
	};

	TMap.Canvas.MapCanvasGL.prototype.glGenTextureCoord = function(rct, w, h) {
		var gl = this.gl;
		const textureCoordBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, textureCoordBuffer);
		var x = rct.x / w, y = rct.y / h, x1 = (rct.x+rct.w)/w, y1 = (rct.y+rct.h)/h;

		const textureCoordinates = [
			x,  y,
			x1,  y,
			x1,  y1,
			x,  y1,
		];

		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoordinates), gl.STATIC_DRAW);
		return textureCoordBuffer;
	}

	TMap.Canvas.MapCanvasGL.prototype.glGenTexture = function(canvas, texture) {
		// Because images have to be download over the internet
		// they might take a moment until they are ready.
		// Until then put a single pixel in the texture so we can
		// use it immediately. When the image has finished downloading
		// we'll update the texture with the contents of the image.
		var gl = this.gl;
		// if (texture == null) 
			texture = gl.createTexture();

		gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
		gl.bindTexture(gl.TEXTURE_2D, texture);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvas);

		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

		texture.gl = gl;

		return texture;
	}

	TMap.Canvas.MapCanvasGL.prototype.glClear = function(mm){
		var gl = this.gl, programInfo = this.glShaderInfo;//, buffers = this.glShaderInfo.buffers;
		gl.clearColor(0.0, 0.0, 0.0, 0.0);  // Clear to black, fully opaque
		gl.clearDepth(1.0);                 // Clear everything
		gl.enable(gl.DEPTH_TEST);           // Enable depth testing  
		gl.depthFunc(gl.LEQUAL);            // Near things obscure far things

		gl.enable(gl.BLEND);
		gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

		// Clear the canvas before we start drawing on it.
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

		gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

		gl.useProgram(programInfo.program);



		{
			gl.bindBuffer(gl.ARRAY_BUFFER, programInfo.buffers.position);
			gl.vertexAttribPointer(programInfo.attribLocations.vertexPosition, 2, gl.FLOAT, false, 0, 0);
			gl.enableVertexAttribArray(programInfo.attribLocations.vertexPosition);
		}

		{
			gl.bindBuffer(gl.ARRAY_BUFFER, programInfo.buffers.textureCoord);
			gl.bufferData(gl.ARRAY_BUFFER, tileTextureArray, gl.STATIC_DRAW);
			gl.vertexAttribPointer(programInfo.attribLocations.textureCoord, 2, gl.FLOAT, false, 0, 0);
			gl.enableVertexAttribArray(programInfo.attribLocations.textureCoord);
		}

		gl.uniform1i(programInfo.uniformLocations.uSampler, 0);

		const fieldOfView = 60 * Math.PI / 180;   // in radians
		const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
		const zNear = 1024;//0.1;
		const zFar = 2048;//100.0;
		const zMiddle = 1500;
		const halfWidth = mm.halfWidth/ mm.ratio;
		const halfHeight = mm.halfHeight/ mm.ratio;
		const projectionMatrix = mat4.create();
		const modelViewMatrix = mat4.create();

		gl.uniformMatrix4fv(programInfo.uniformLocations.componentMatrix, false, modelViewMatrix);

		mat4.perspective(projectionMatrix, fieldOfView, aspect, zNear, zFar);
		projectionMatrix[0] = zMiddle / halfWidth;
		projectionMatrix[5] = zMiddle / halfHeight;
		
		// mat4.frustum(projectionMatrix, -halfWidth, halfWidth, -halfHeight, halfHeight, zNear, zFar);
		
		gl.uniformMatrix4fv(programInfo.uniformLocations.projectionMatrix, false, projectionMatrix);

		// mat4.translate(modelViewMatrix, modelViewMatrix, [0, 0, -6]);  // amount to translate
		// gl.uniformMatrix4fv(programInfo.uniformLocations.modelViewMatrix, false, modelViewMatrix);

		// const modelViewMatrix = mat4.create();
		mat4.scale(modelViewMatrix, modelViewMatrix, [mm.scale/mm.ratio, mm.scale/mm.ratio, 1]);
		
		mat4.translate(modelViewMatrix, modelViewMatrix, [0, 0, -zMiddle]);  // amount to translate
		if (mm.tilt != 0) 
			mat4.rotate(modelViewMatrix, modelViewMatrix, mm.tilt, [1, 0, 0]);
		if (mm.rotate != 0)
			mat4.rotate(modelViewMatrix, modelViewMatrix, -mm.rotate, [0, 0, 1]);
			// mat4.rotate(modelViewMatrix, modelViewMatrix, this._cur, [0, 0, 1]);
			// this._cur += 0.1;

		gl.uniformMatrix4fv(programInfo.uniformLocations.modelViewMatrix, false, modelViewMatrix);

		gl.activeTexture(gl.TEXTURE0);


	}

	TMap.Canvas.MapCanvasGL.prototype.glDraw = function(tiles, mm) { 
		var gl = this.gl, programInfo = this.glShaderInfo;

		for (var i = 0, tile, l = tiles.length; i < l; ++i) {
			tile = tiles[i];
			if (tile.tex == null)
				continue;
			gl.bindTexture(gl.TEXTURE_2D, tile.tex);

			const tileMatrix = mat4.create();
			const matTile = tile.layer.glMatrix(mm, tile);
			
			mat4.translate(tileMatrix, tileMatrix, matTile[0]);
			matTile[1] && mat4.scale(tileMatrix, tileMatrix, matTile[1]); 

			gl.uniformMatrix4fv(programInfo.uniformLocations.tileMatrix, false, tileMatrix);      

			gl.drawArrays(gl.TRIANGLE_FAN, 0, 4); 
		}
	}

	TMap.Canvas.MapCanvasGL.prototype.glDrawLabel = function(tiles, mm) { 
		var gl = this.gl, programInfo = this.glShaderInfo, rscale = mm.ratio/mm.scale;

		for (var i = 0, tile, l = tiles.length; i < l; ++i) {
			tile = tiles[i];
			if (tile.l && tile.z == mm.z) {
				const tileMatrix = mat4.create();
				const matTile = tile.layer.glMatrix(mm, tile)[0];
				mat4.translate(tileMatrix, tileMatrix, matTile);
				gl.uniformMatrix4fv(programInfo.uniformLocations.tileMatrix, false, tileMatrix);      
			
				var translater = [0, 0, 0];
				for (var j = 0, lbl, ll = tile.l.length; j < ll; ++j) {
					lbl = tile.l[j];

					// if (lbl.glElems == null) return;
					// for (var gi = 0, elem; elem = lbl.glElems[gi]; ++gi) {
					// 	gl.bufferData(gl.ARRAY_BUFFER, genTextureCoord(elem.rect, elem.iw, elem.ih), gl.STATIC_DRAW);
					// 	gl.bindTexture(gl.TEXTURE_2D, elem.tex || tile.ltex);

					// 	const comMatrix = mat4.create();
					// 	mat4.translate(comMatrix, comMatrix, elem.pos );

					// 	if (mm.tilt != 0) 
					// 		mat4.rotate(comMatrix, comMatrix, -mm.tilt, [1, 0, 0]);
					// 	if (mm.rotate != 0)
					// 		mat4.rotate(comMatrix, comMatrix, mm.rotate, [0, 0, 1]);

					// 	mat4.scale(comMatrix, comMatrix, [elem.rect.w*rscale/512.0, elem.rect.h*rscale/512.0, 1]); 

					// 	gl.uniformMatrix4fv(programInfo.uniformLocations.componentMatrix, false, comMatrix);      

					// 	gl.drawArrays(gl.TRIANGLE_FAN, 0, 4); 
					// }

					if (lbl.imgInfo != null && lbl.img != null) {
						gl.bufferData(gl.ARRAY_BUFFER, genTextureCoord(lbl.imgInfo, lbl.img.width, lbl.img.height), gl.STATIC_DRAW);
						gl.bindTexture(gl.TEXTURE_2D, lbl.tex);

						const comMatrix = mat4.create();
						translater[0] = lbl.a[0]-lbl.imgInfo.w/4;
						translater[1] = 256-lbl.a[1]-lbl.imgInfo.h/4;
						mat4.translate(comMatrix, comMatrix, translater);

						if (mm.tilt != 0) 
							mat4.rotate(comMatrix, comMatrix, -mm.tilt, [1, 0, 0]);
						if (mm.rotate != 0)
							mat4.rotate(comMatrix, comMatrix, mm.rotate, [0, 0, 1]);

						mat4.scale(comMatrix, comMatrix, [lbl.imgInfo.w*rscale/512.0, lbl.imgInfo.h*rscale/512.0, 1]); 

						gl.uniformMatrix4fv(programInfo.uniformLocations.componentMatrix, false, comMatrix);      

						gl.drawArrays(gl.TRIANGLE_FAN, 0, 4); 
					}

					if (lbl.rect) {
						gl.bufferData(gl.ARRAY_BUFFER, genTextureCoord(lbl.rect, 512, 512), gl.STATIC_DRAW);
						gl.bindTexture(gl.TEXTURE_2D, tile.ltex);

						const comMatrix = mat4.create();
						translater[0] = lbl.a[0]+26;
						translater[1] = 256-lbl.a[1];
						mat4.translate(comMatrix, comMatrix, translater);

						if (mm.tilt != 0) 
							mat4.rotate(comMatrix, comMatrix, -mm.tilt, [1, 0, 0]);
						if (mm.rotate != 0)
							mat4.rotate(comMatrix, comMatrix, mm.rotate, [0, 0, 1]);

						mat4.scale(comMatrix, comMatrix, [lbl.rect.w*rscale/512.0, lbl.rect.h*rscale/512.0, 1]); 

						gl.uniformMatrix4fv(programInfo.uniformLocations.componentMatrix, false, comMatrix);      

						gl.drawArrays(gl.TRIANGLE_FAN, 0, 4); 
					}
						
				}
			}
		}
	}

})();