const  L = 101;
var grid_buffer1 = new ArrayBuffer(L*L);
var grid = new Uint8ClampedArray(grid_buffer1);
const scale_factor = 4;
const Npix = L*L*scale_factor*scale_factor;
var imgData = new ImageData(L*scale_factor,L*scale_factor); 
var imgDataMap_buffer = new ArrayBuffer(Npix*4); //4 bytes per pixel, for 32 bit integer addressing. 
var imgDataMap = new Int32Array(imgDataMap_buffer);

var unstableSites = [];
var nextUnstableSites = [];

const STATE_ADDING = 0;
const STATE_TOPPLING = 1;
var state = STATE_ADDING;

function ind_to_x(ind) { return ind%L; }
function ind_to_y(ind) { return Math.floor(ind/L); }
function xy_to_ind(x,y) { return x+y*L; }

function addToInd(ind){ grid[ind] +=1;  if(grid[ind] == 4) { nextUnstableSites.push(ind); }  }
function addToXY(x,y){
    if(x>=0 && x < L-1 && y>=0 && y < L-1) { 
        ind = xy_to_ind(x,y);
        addToInd(ind);
    }  
}
function toppleInd(grid,ind){ x = ind_to_x(ind); y = ind_to_y(ind); grid[ind] -= 4; addToXY(x+1,y); addToXY(x-1,y); addToXY(x,y+1); addToXY(x,y-1);  }

const xcenter = Math.floor(L/2), ycenter = Math.floor(L/2);
var iters = 0;
var goalIteration = 0;
function clearGrid(){ 
    iters = 0;
    state =  STATE_ADDING; 
    for(var i = 0; i < L*L;i++){ grid[i] = 0; } 
    nextUnstableSites = [];
    unstableSites = [];
}

function jumpToFrame(){
    if(iters > goalIteration){ clearGrid(); }
    while(iters < goalIteration){ tick(); } 
}

function tick(){
    iters+=1;
    nextUnstableSites = []; 
    if(state == STATE_ADDING){
        addToXY(xcenter,ycenter);
    } else if(state == STATE_TOPPLING){
        state = STATE_ADDING;
        for (var i = 0 ; i < unstableSites.length; i ++){
            ind = unstableSites[i];
            toppleInd(grid,ind);
        }
    }
    if(nextUnstableSites.length > 0){
        state = STATE_TOPPLING;
    }
    unstableSites = nextUnstableSites;
}

function draw() {
    //TODO: blit from the updated sites? 
        // blit all? Or just the updated ones. Could updated 'add to ind' to label the updated sites..

    //blitting every site!
    //color each pixel based on the source in the grid. 
    for(var ind = 0; ind < Npix; ind++){
        // *4 b/c each pixel is rgba. +1 to get green component. 
        // imgData.data[ind * 4 + 1] = 32;
        imgData.data[ind * 4 + 0] =  192 - (grid[imgDataMap[ind]])*64;
        imgData.data[ind * 4 + 1] =  192 - (grid[imgDataMap[ind]])*32;
        imgData.data[ind * 4 + 2] = 256 - 16*(grid[imgDataMap[ind]]);
    }
    ctx.putImageData(imgData,0,0)
}

var lastframems = 0;
var dtSinceLastFrame = 0;
var frameRate = 1;
function main_loop(timestamp){
    var dt = timestamp - lastframems;
    dtSinceLastFrame += dt; 
    // console.log(dt)
    if(dtSinceLastFrame > 0.){ //can reduce frame rate using this. 
        goalIteration+=frameRate;
        jumpToFrame();
        draw();
        frameNumberBox.textContent=iters;
        dtSinceLastFrame = 0;
    }
    lastframems = timestamp;
    requestAnimationFrame(main_loop);
}



function init(){
    //fixing the alpha values in the img_buffer.
    for(var i =3 ; i < Npix*4; i+=4){ imgData.data[i] = 255; }
    //making it green!
    for(var i =1 ; i < Npix*4; i+=4){ imgData.data[i] = 128; }
    //building the image data map: 
    var ind = 0;
    for(var y=0; y < L*scale_factor; y++){
        for(var x = 0; x < L * scale_factor; x++){
            ind = y*L*scale_factor + x;
            imgDataMap[ind] = xy_to_ind(Math.floor(x / scale_factor),Math.floor(y/scale_factor));
        }
    }

    requestAnimationFrame(main_loop);
}
const frameNumberBox = document.getElementById('frameNoBox');
const frameInputBox = document.getElementById('frameInputBox');


function setFrameEvent(e) {
    inputValue = frameInputBox.value;
    //clean the value: 
    inputValue = Math.floor(inputValue);
    inputValue = Math.max(inputValue,0);
    frameInputBox.value = inputValue;
    //now, update the simulation
    frameRate = 0;
    goalIteration = inputValue;
    // jumpToFrame(inputValue);
}
frameInputBox.addEventListener('change',setFrameEvent)

function addSpeedControl(label,rate){
    var elem = document.getElementById(label);
    elem.addEventListener('click', function(e){frameRate = rate; });
}
addSpeedControl('frameRate0x',0);
addSpeedControl('frameRate1x',1);
addSpeedControl('frameRate2x',2);
addSpeedControl('frameRate5x',5);
addSpeedControl('frameRate10x',10);
addSpeedControl('frameRate100x',100);


const can = document.getElementById('can');
const ctx = can.getContext("2d");
document.addEventListener('DOMContentLoaded', init, false);
