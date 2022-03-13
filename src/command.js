import Grid from "./grid.js";
import Input from "./input.js";
import Object from "./object.js";
import Profile from "./func.js";
import Props from "./props.js";
import {Func} from "./func.js";
import Timeline from "./time.js";

var unitPx;

export default class Command{
    constructor(loopStart, canvas, svg){
        this.darkMode = true;
        this.phoneMode = false;
        //
        this.canvas = canvas;
        this.ctx = canvas.getContext("2d");
        this.svg = svg;
        //
        this.scrW = parseInt(this.svg.style("width"));//return screen width in pixels
        this.scrH = parseInt(this.svg.style("height"));//return screen height in pixels
        //
        unitPx = this.scrH / 900;//pixels for not unit based sizing (dependent on window height)
        this.unitPx = unitPx;
        //
        this.lastTime = 0;
        //
        this.gravity = -9.81;
        this.time = 0;
        this.rate = 1;//seconds / second
        //
        this.running = false;
        this.loopStart = loopStart;
        //
        this.vectorMode = 0;//status of vectors, 0 = hidden, 1 = velocity, 2 = acceleration, -1 = both
        this.highestVector = 2;//power of highest vector
        this.viewType = 0;//type of grid view, 0 = x and y, 1 = x, 2 = y
        //
        this.autoScale = false;
        this.showExtremes = true;
        this.timeSnapping = false;
        //
        this.idCount = 0;
        //
        this.selected = null;
        this.objects = [];
        this.selectedIdxs = [];
        //
        this.defaultScale = 20;
        this.grid = new Grid(this, this.ctx, this.svg, 0, 0, this.defaultScale);
        this.grid.calcSize();//get scales and things
        //
        this.timeline = new Timeline(this, document.getElementById('timeCanvas'), d3.select("#timeSVG"), 10);
        //
        this.input = new Input(this);
        this.props = new Props(this);
        //
        //this.para = new Para(this.time, 1, [1,4],[2,1,3],0,0);
        //
        this.sels = [];
        this.selObs = [];
        //
        this.dragBox = this.svg.append("rect").style("stroke", "#47a3ff").style("fill", "#47d7ff").style("fill-opacity", .6).style("visibility", "hidden");
        //
        this.func = new Func(1000, [1, 1]);
        this.func.resolve([[0, 0, 0], [18.5, 1, 0], [46.1, 1, 2.47]]);
        //this.func.draw(this, -10, 10);
        //console.log(`------`);
        //console.log(`Acceleration: ${this.func.terms[0].coef * 2}`);
        //console.log(`Distance: ${this.func.calc(2.47)}`);
        //console.log(`------`);
        //
        this.prof = new Profile(this, 2, [1, 0], [2, 1, 3], 'green');
        this.prof.draw(0, 500);
        this.prof.newPiece([1, 0], [3.5, 3], 0, 0);
        this.prof.newPiece([1, 0], [-1, 2, 4], .5, 0);
        this.prof.newPiece([1, 0], [2, 4], 1, 1);
        //
        //this.prof2 = new Profile(this, 2, [1, 0], [-1, 4], 'blue');
        //this.prof2.draw(0, 500);
        //
        this.moveGrid();
        //console.log(`accel: ${this.func.terms[0].coef * 2}`);
        //
        let func1 = new Func(1, [4, -22, 36, -18]);//4x^{3}-22x^{2}+35x-15
        //let func1 = new Func(1, [4,-16,15,-1,-1]);//4x^{4}-16x^{3}+15x^{2}-x-1
        console.log(func1.approxRoots(func1, .0001));
        //
        //this.func.approxMatrix([[4, 0, 0], [62, 0, -2], [6, 2, 0], [-54, 2, 2], [18, 3, 1]]);
        //this.func.approxMatrix([[-29, 0, -2], [-1, 0, 0], [3, 1, 1], [-40, 2, -2]]);
        this.newObject((this.scaleX.range()[1] - this.scaleX.range()[0]) / 2, (this.scaleY.range()[0] - this.scaleY.range()[1]) / 2);
        this.input.moveState = 0;
        this.drawGrid();
        this.spawnExtremes([this.objects[0]]);
        this.toggleVectors(1);
    }
    //
    //#region View Control
    /**
     * Shift the center of the view by pixels
     * @param {Number} cx x change in pixels
     * @param {Number} cy y change in pixels
     */
    shiftView(cx, cy){
        this.grid.shiftPos(cx, cy);
        this.updateView();
    }
    //
    /**
     * Set the center and scale of the view
     * @param {Number} cx       center x in units
     * @param {Number} cy       center y in units
     * @param {Number} [width]  width in units
     * @param {Number} [height] height in units
     */
    setView(cx, cy, width, height){
        if(width){
            this.grid.strX = (width / height) / (this.scrW / this.scrH);//how much are x pixels stretched
        }
        //
        if(!height){
            this.grid.scale = height;
        }
        //
        this.grid.cx = cx;
        this.grid.cy = cy;
        this.updateView();
    }
    //
    /**
     * Zoom in or out around mouse
     * @param {Number} c  change in zoom (multiplier)
     * @param {Number} px mouse x position in pixels
     * @param {Number} py mouse y position in pixels
     */
    zoom(c, px, py){
        this.grid.zoom(c, px, py);
        this.updateView();
    }
    //
    zoomX(c, px, py){
        this.grid.zoomX(c, px, py);
        this.updateView();
    }
    //
    /**
     * check if auto scaling and scale if true
     */
    runAuto(){
        if(this.autoScale){
            this.grid.normalize();
        }
    }
    //
    zoomTimeline(c, px, py){
        this.timeline.zoom(c, px, py);
        this.drawTimeline();
        this.moveTimeline();
        this.retimeExtremes();
    }
    //
    /**
     * resize all elements on resize event
     */
    resize(){
        this.grid.resize();
        this.timeline.resize();
        this.drawGrid();
        this.moveGrid();
        this.drawTimeline();
        this.moveExtremes();
        this.moveSelects();
    }
    //
    /**
     * update the grid after a change in the view
     */
    updateView(){
        this.drawGrid();
        this.moveGrid();
        this.moveExtremes();
        this.moveSelects();
    }
    //#endregion
    //
    //#region Illustration
    changeViewType(type){
        this.viewType = type;
        if(type == 0){
            this.objects.forEach(obj => {
                obj.self.attr("r", pixels(20));
            });
        }else{
            this.objects.forEach(obj => {
                obj.self.attr("r", pixels(15));
            });
        }
        this.sels.forEach((sel, idx) => {
            sel.attr("r", parseInt(this.selObs[idx].self.attr("r")) + pixels(5));
        });
        this.fullReset();
        this.runAuto();
    }
    //
    /**
     * Update and Redraw all elements on the site
     */
    fullReset(){
        this.updateGrid();
        this.drawGrid();
        this.moveGrid();
        this.drawTimeline();
        this.moveTimeline();
        this.toggleVectors();
        this.props.update(this.selected);
        this.spawnExtremes();
    }
    //
    /**
     * redraw grid (canvas)
     */
    drawGrid(){
        this.grid.draw(this.ctx);
        this.objects.forEach(obj => {
            obj.draw(this.input);
        });
        //this.prof.draw(0, 500);
    }
    //
    /**
     * redraw timeline (canvas)
     */
    drawTimeline(){
        this.timeline.draw();
    }
    //
    /**
     * move all or some svg elements in grid
     * @param {Array<Object>} [objs] list of objects to move
     */
    moveGrid(objs){
        if(!objs){
            objs = this.objects;
        }
        //
        objs.forEach(obj => {
            obj.move();
        });
    }
    //
    /**
     * update the values of all or some objects
     * @param {Array<Object>} [objs] list of objects to update
     */
    updateGrid(objs, noProps=false){
        if(!objs){
            objs = this.objects;
        }
        //
        this.objects = this.objects.filter(obj => !obj.toBeDeleted);
        objs.forEach(obj => {
            obj.update();
        });
        this.moveSelects();
        if(!noProps){
            this.props.update(this.selected);
        }
    }
    //
    /**
     * move all or some svg elements in timeline
     * @param {Array<Object>} [objs] list of objects to move
     */
    moveTimeline(objs, noProps = false){
        if(!objs){
            objs = this.objects;
        }
        //
        this.timeline.move();
        if(!noProps){
            this.props.retime();
        }
    }
    //
    /**
     * update the function display of objects
     * @param {Array<Object>} objs list of objects to update the functions for
     */
    funcChange(objs){
        this.drawGrid();
        this.spawnExtremes(objs);
    }
    //
    /**
     * A list of functions to be executed when object positions are changed
     * @param {Array<Object>} objs objects to update
     * @param {Boolean} noProps    whether or not to update the prop numbers (true means don't)
     */
    objPosChange(objs, noProps=false){
        this.updateGrid(objs, noProps);
        this.moveGrid(objs);
        this.drawGrid();
        this.spawnExtremes(objs);
    }
    //
    /**
     * Set the visible vectors for all or some objects
     * @param {Array<Object>} [objs] list of objects to toggle
     * @param {Number} [mode]        vector mode to set objects to
     */
    toggleVectors(mode, objs){
        if(!objs){
            objs = this.objects;
            if(mode || mode == 0){
                this.vectorMode = mode;
            }
        }
        if(!mode){
            mode = this.vectorMode;
        }
        //
        objs.forEach(obj => {
            obj.toggleVectors(mode);
        });
    }
    //
    /**
     * Remove and respawn extreme points for all or some objects on grid and timeline
     * @param {Array<Object>} [objs] list of objects to spawn extremes for
     */
    spawnExtremes(objs){
        if(this.showExtremes){
            if(!objs){
                objs = this.objects;
            }
            //
            var objIds = [];
            objs.forEach(obj => {
                obj.spawnExtremes();
                objIds.push(obj.idx);
            });
            this.timeline.spawnExtremes(objIds);
        }
    }
    //
    /**
     * shift the timing of all or some extreme points (only affects the timline)
     * @param {Array<Object>} [objs] list of objects to retime extremes for
     */
    retimeExtremes(objs){
        if(!objs){
            objs = this.objects;
        }
        //
        this.timeline.movePoints(this.findIdxs(objs));
    }
    //
    /**
     * move all the extreme points on the field
     */
    moveExtremes(){
        this.objects.forEach(obj => {
            obj.movePoints();
        });
    }
    //
    /**
     * delete all the extremes for an object
     * @param {Object} obj the object to delete the extremes for
     */
    deleteExtreme(obj){
        this.timeline.deleteExtreme(this.findIdxs([obj])[0]);
    }
    //
    /**
     * delete all extremes for all objects in the field and timeline
     */
    deleteAllExtremes(){
        this.objects.forEach(obj => {
            obj.points.forEach(point => {
                point.remove();
            });
            obj.points = [];
            obj.extremes = [];
        })
        this.timeline.timePoints.forEach(obj => {
            obj.forEach(point => {
                point.remove();
            });
            obj.points = [];
        });
        this.timeline.timePoints = [];
    }
    //
    /**
     * Check the highest non-zero power in the list of objects for arrow purposes
     */
    checkArrows(){//add profile function for cleaning up derivatives, otherwise this doesn't work
        this.highestVector = 0;
        this.objects.forEach(obj => {
            if(obj.profile.pieces[obj.piece].paras.length - 1 > this.highestVector){
                this.highestVector = obj.profile.pieces[obj.piece].paras.length - 1;
            }
            obj.respawnArrows();
        });
        console.log(`highest vector: ${this.highestVector}`);
        //
        let arrowOptions = d3.select('#arrowDisplayDrop').selectAll('option').nodes();
        arrowOptions.slice(0, this.highestVector + 2).forEach(opt => {
            d3.select(opt).style('display', 'block');
        });
        //
        arrowOptions.slice(this.highestVector + 2).forEach(opt => {
            d3.select(opt).style('display', 'none');
        });
        //
        if(this.vectorMode > this.highestVector){
            this.vectorMode = this.highestVector;
            d3.select(d3.select('#arrowDisplayDrop').selectAll('option').nodes()[this.vectorMode+1]).property('selected', 'selected');
        }
    }
    //
    /**
     * Find indexs of objects
     * @param {Array<Object>} objs list of objects to find the index of
     * @returns {Array<Number>} list of indexs of those objects (in order)
     */
    findIdxs(objs){
        var idxs = [];
        objs.forEach(obj => {
            idxs.push(obj.idx);
        });
        //console.log(`found idxs: ${idxs}`);
        return idxs;
    }
    //#endregion
    //
    //#region Value Setting
    /**
     * shift the position of objects
     * @param {Number} power      power of position to shift
     * @param {Number} cx         change in x in pixels
     * @param {Number} cy         change in y in pixels
     * @param {Array<Object} objs list of objects to shift
     * @param {Number} [time]     time to shift position at
     */
    shiftPos(power, cx, cy, objs, time){
        if(arguments.length < 5){
            time = this.time;
        }
        //console.log(`shifting position at time ${time} with ${cx}, ${cy}`);
        switch(this.viewType){
            case 0:
                objs.forEach(obj => {
                    let curPos = obj.getVals(power, time);
                    let x = this.scaleX.invert(this.scaleX(curPos[0]) + cx);
                    let y = this.scaleY.invert(this.scaleY(curPos[1]) + cy);
                    obj.setValueTime(power, time, x, y);
                });
                break;
            case 1:
                var t = this.scaleX.invert(this.scaleX(time) + cx);
                objs.forEach(obj => {
                    let curPos = obj.getVals(power, time);
                    let x = this.scaleY.invert(this.scaleY(curPos[0]) + cy);
                    let y = curPos[1];
                    obj.profile.shiftPropagate(t, this.grid.conX(cx));
                    obj.setValueTime(power, t, x, y);
                });
                this.setTime(this.time + (t - time));
                break;
            case 2:
                var t = this.scaleX.invert(this.scaleX(time) + cx);
                objs.forEach(obj => {
                    let curPos = obj.getVals(power, time);
                    let x = curPos[0];
                    let y = this.scaleY.invert(this.scaleY(curPos[1]) + cy);
                    obj.setValueTime(power, t, x, y);
                    obj.profile.shiftPropagate(t, this.grid.conX(cx));
                });
                this.setTime(this.time + (t - time));
                break;
        }
    }
    //
    /**
     * set the position of one object and shift all the rest
     * @param {Number} power      power of position to shift
     * @param {Number} px         new x position in pixels
     * @param {Number} py         new y position in pixels
     * @param {Array<Object} objs list of objects to shift
     * @param {Number} [time]     time to shift position at
     */
    setScreenPos(power, px, py, objs, time){
        if(arguments.length < 5){
            time = this.time;
            this.shiftPos(power, px - this.scaleX(this.selected.px), py - this.scaleY(this.selected.py), objs, time);
        }else{
            let ox;
            let oy;
            //
            switch(this.viewType){
                case 0:
                    ox = this.selected.profile.calc(0, time)[0];
                    oy = this.selected.profile.calc(0, time)[1];
                    break;
                case 1:
                    ox = this.selected.profile.getValIdx(time);
                    oy = this.selected.profile.calc(0, time)[0];
                    break;
                case 2:
                    ox = this.selected.profile.getValIdx(time);
                    oy = this.selected.profile.calc(0, time)[1];
                    break;
            }
            this.shiftPos(power, px - this.scaleX(ox), py - this.scaleY(oy), objs, time);
        }
    }
    //
    /**
     * set the position of an object
     * @param {Number} power power of position to set
     * @param {Number} px    new x position in units
     * @param {Number} py    new y position in units
     * @param {Object} obj   object to set position of
     */
    setPos(power, px, py, obj){
        obj.setValue(power, px, py);
    }
    //
    /**
     * shift the current time
     * @param {Number} dt change in time in seconds
     */
    shiftTime(dt){
        this.setTime(this.time + dt);
    }
    //
    /**
     * set the current time
     * @param {Number} t new time in seconds
     */
    setTime(t, noProps = false){
        this.time = t;
        this.updateGrid();
        this.moveGrid();
        this.moveTimeline(this.objects, noProps);
    }
    //
    /**
     * Add an object at the last mouse position
     * @param {Number} px starting x mouse position in pixels
     * @param {Number} py starting y mouse position in pixels
     */
    newObject(px, py){
        this.input.moveState = 3;
        this.input.active = new Object(this, this.idCount, px, py);
        this.objects.push(this.input.active);
        this.idCount++;
        //
        if(this.viewType != 0){
            this.input.active.self.attr("r", pixels(15));
            this.input.active.update();
            this.input.active.move();
        }
        this.select(this.input.active);
        this.selected.self.raise();
        this.drawTimeline();
        this.checkArrows();
    }
    //
    /**
     * save the current state of the objects
     */
    saveState(){
        var str = "";
        this.objects.forEach((obj, idx) => {//loop objects
            let objStr = `{object ${idx}\n`;
            //
            let pieces = obj.profile.pieces;
            pieces.forEach((piece, idx) => {//loop pieces
                objStr += `{piece ${idx}\n`;
                //
                piece.comps.forEach((power, idx) => {//loop powers
                    objStr += `{power ${idx}\n`;
                    //
                    power.forEach((comp, idx) => {//loop comps
                        objStr += `{comp ${idx}\n`;
                        //
                        objStr += `<${comp.xFunc.getCoefs()}>, <${comp.yFunc.getCoefs()}>\n`;//record coefs
                        //
                        objStr += `}\n`;
                    });
                    //
                    objStr += `}\n`;
                });
                //
                objStr += `}\n`;
            });
            //
            objStr += `[bounds\n`;
            obj.profile.bounds.forEach(bound => {
                objStr += `${bound}\n`;
            });
            objStr += `]\n`;
            //
            objStr += `[junctions\n`;
            obj.profile.junctions.forEach(junc => {
                objStr += `${junc}\n`;
            });
            objStr += `]\n`;
            //
            objStr += `}\n`;
            //
            str += objStr;
        });
        //
        str += `[user settings\n`;
        str += `${d3.select('#gravityCheck').property('checked') ? 1 : 0},${d3.select('#gravitySet').property('value')}\n`;
        str += `<${this.scaleX.domain()[0]},${this.scaleX.domain()[1]}>\n`;
        str += `<${this.scaleY.domain()[0]},${this.scaleY.domain()[1]}>\n`;
        str += `${this.autoScale ? 1 : 0}\n`;
        str += `${this.timeSnapping ? 1 : 0}\n`;
        str += `${this.showExtremes ? 1 : 0}\n`;
        str += `]\n`;
        //
        str += `[state settings\n`;
        str += `${this.time}\n`;
        str += `${this.vectorMode}\n`;
        str += `${this.viewType}\n`;
        str += `]\n`;
        //
        str += `[prop settings\n`;
        str += `]\n`;
        //
        console.log(str);
        var today = new Date();
        var time = today.getHours() + ":" + today.getMinutes();
        download(`phsycalc[${time}].csv`, str);
    }
    //
    /**
     * open a given file and overwrite the current state
     * @param {File} file file as received from the file input
     */
    openState(file){
        var comm = this;
        //
        this.nukeIt();
        //
        console.log(file);
        const reader = new FileReader();
        reader.addEventListener('load', function() {//file reading is asynchronous, so this actually executes after the readAsText
            //
            let lines = this.result.split("\n");
            let lineIdx = 0;
            //
            while(lines[lineIdx].charAt(0) == "{"){//loop objects
                lineIdx++;
                //
                let newObj = new Object(comm, comm.idCount, 0, 0);
                comm.objects.push(newObj);
                comm.idCount++;
                //
                let pieces = [];
                //
                while(lines[lineIdx].charAt(0) == "{"){//loop pieces
                    lineIdx++;
                    //
                    pieces.push([]);
                    //
                    while(lines[lineIdx].charAt(0) == "{"){//loop powers
                        lineIdx++;
                        //
                        let powers = pieces[pieces.length - 1]
                        powers.push([]);
                        //
                        while(lines[lineIdx].charAt(0) == "{"){//loop comps
                            lineIdx++;
                            //
                            console.log(lines[lineIdx]);
                            let line = lines[lineIdx]
                            var xStart = 1;
                            var xEnd = moveToNext(line, xStart, '>');
                            var yStart = xEnd + 4;
                            var yEnd = moveToNext(line, yStart, '>');
                            //
                            let xCoefs = line.slice(xStart, xEnd).split(',').map(x => parseFloat(x));
                            let yCoefs = line.slice(yStart, yEnd).split(',').map(x => parseFloat(x));
                            //
                            powers[powers.length - 1].push([xCoefs, yCoefs]);
                            //
                            lineIdx += 2;
                        }
                        //
                        lineIdx++;
                    }
                    //
                    lineIdx++;
                }
                //
                let bounds = [];
                lineIdx++;//enter bounds
                while(lines[lineIdx].charAt(0) != "]"){//loop bounds
                    bounds.push(lines[lineIdx].split(',').map(x => parseFloat(x)));
                    lineIdx++;
                }
                lineIdx++;//exit bounds
                //
                let junctions = []
                lineIdx++;//enter junctions
                while(lines[lineIdx].charAt(0) != "]"){//loop junctions
                    junctions.push(parseInt(lines[lineIdx]));
                    lineIdx++;
                }
                lineIdx++;//exit junctions
                //
                newObj.profile.loadPieces(pieces, bounds, junctions);
                //
                lineIdx++;
            }
            //
            lineIdx++;//enter user settings
            //
            let gravStore = lines[lineIdx].split(',');//get gravity
            console.log(`gravity got: ${gravStore[1]}`);
            d3.select('#gravityCheck').property('checked', gravStore[0] == 1);
            d3.select('#gravitySet').property('value', gravStore[1]);
            if(gravStore[0] == 1){
                comm.gravity = parseFloat(gravStore[1]);
            }else{
                comm.gravity = 0;
            }
            //
            lineIdx++;
            let xVals = lines[lineIdx].slice(1, moveToNext(lines[lineIdx], 1, '>')).split(',').map(x => parseFloat(x));
            lineIdx++;
            let yVals = lines[lineIdx].slice(1, moveToNext(lines[lineIdx], 1, '>')).split(',').map(x => parseFloat(x));
            comm.grid.setSizeByEdge({left: xVals[0], right: xVals[1], top: yVals[1], bottom: yVals[0]});
            //
            lineIdx++;
            this.autoScale = lines[lineIdx] == 1;
            lineIdx++;
            this.timeSnapping = lines[lineIdx] == 1;
            lineIdx++;
            this.showExtremes = lines[lineIdx] == 1;
            //
            lineIdx += 3;//enter state settings
            //
            comm.time = parseFloat(lines[lineIdx]);
            lineIdx++;
            comm.vectorMode = parseInt(lines[lineIdx]);
            lineIdx++;
            comm.viewType = parseInt(lines[lineIdx]);
            //
            comm.updateGrid();
            comm.drawGrid();
            comm.moveGrid();
            comm.moveTimeline();
            comm.drawTimeline();
            comm.spawnExtremes();
            comm.toggleVectors(1);
        });
        reader.readAsText(file);
        d3.select("#getFile").style("pointer-events", "none");
    }
    //
    nukeIt(){
        this.objects.forEach(obj => {
            obj.delete(false);
        });
        this.objects = [];
        //
        this.idCount = 0;
        //
        this.deleteAllExtremes();
        //
        this.select();
    }
    //#endregion
    //
    //#region Selecting
    /**
     * select a new main object and deselect all others
     * @param {Object} [obj] object to select
     */
    select(obj){
        if(!obj){
            this.sels.forEach(sell => {
                sell.remove();
            });
            this.sels = [];
            this.selObs = [];
            this.props.update();
            this.props.diffObj();
        }else if(!this.input.shifting){
            this.sels.forEach(sell => {
                sell.remove();
            });
            this.sels = [this.svg.append("circle").style("stroke", "#47a3ff").style("fill", "transparent").style("stroke-width", pixels(4)).style("stroke-opacity", .6)
                    .attr("r", parseInt(obj.self.attr("r")) + pixels(5))
                    .attr("cx", this.scaleX(obj.px))
                    .attr("cy", this.scaleY(obj.py))];
            this.selObs = [obj];
            this.selected = obj;
            this.props.diffObj(obj);
            obj.raise();
        }
    }
    //
    /**
     * move all selection SVG elements
     */
    moveSelects(){
        this.sels.forEach((sel, idx) => {
            sel.attr("cx", this.scaleX(this.selObs[idx].px)).attr("cy", this.scaleY(this.selObs[idx].py));
        });
    }
    //
    /**
     * add a new object to selected objects
     * @param {Object} obj object to add to selection
     */
    shiftSelect(obj){
        if(this.selObs.includes(obj)){//object has already been selected
            var idx = this.selObs.indexOf(obj);
            if(idx == 0 && this.sels.length > 1){//object is main select but there are other selects
                this.selObs.splice(idx, 1);//remove select
                this.sels[idx].remove();
                this.sels.splice(idx, 1);
                this.sels[0].style("stroke", "#47a3ff");
            }else if(idx == 0){//object is main select and there are no other selects
                this.select();//deselect all
            }else{//object is misc. select
                this.selObs.splice(idx, 1);//remove select
                this.sels[idx].remove();
                this.sels.splice(idx, 1);
            }
        }else{//object had not been selected
            this.sels.push(this.svg.append("circle").style("stroke", "#47d7ff").style("stroke-width", pixels(4)).style("fill", "transparent").style("stroke-opacity", .6)
                            .attr("r", parseInt(obj.self.attr("r")) + 5)
                            .attr("cx", this.scaleX(obj.px))
                            .attr("cy", this.scaleY(obj.py)));
            this.selObs.push(obj);
        }
        obj.self.raise();
    }
    //
    /**
     * select a group of objects by dragging mouse
     * @param {Number} sx x start of drag in pixels
     * @param {Number} sy y start of drag in pixels
     * @param {Number} lx last mouse x value in pixels
     * @param {Number} ly last mouse y value in pixels
     * @param {Number} nx new mouse x value in pixels
     * @param {Number} ny new mouse y value in pixels
     */
    dragSelect(sx, sy, nx, ny){
        this.sels.forEach(sell => {
            sell.remove();
        });
        this.sels = [];
        this.selObs = [];
        //
        if(nx > sx){
            this.dragBox.attr("x", sx).attr("width", nx - sx);
        }else{
            this.dragBox.attr("x", nx).attr("width", sx - nx);
        }
        //
        if(ny > sy){
            this.dragBox.attr("y", sy).attr("height", ny - sy);
        }else{
            this.dragBox.attr("y", ny).attr("height", sy - ny);
        }
        this.dragBox.style("visibility", "visible");
        //
        this.objects.forEach(obj => {
            if(inBounds(obj.self.attr("cx"), obj.self.attr("cy"), sx, sy, nx, ny)){
                this.shiftSelect(obj);
            }
        });
    }
    //
    /**
     * set which object is main (displayed in props)
     * @param {Object} obj object to set as main selection
     */
    mainSelect(obj){//change which object is main (and whose props are displayed)
        var idx = this.selObs.indexOf(obj);
        this.selObs.splice(0, 0, this.selObs.splice(idx, 1)[0]);
        this.sels.splice(0, 0, this.sels.splice(idx, 1)[0]);
        //
        this.sels[0].style("stroke", "#47a3ff");
        this.sels[1].style("stroke", "#47d7ff");
        //
        this.props.diffObj(obj);
    }
    //#endregion
}

function pixels(px){
    return px * unitPx;
}

function inBounds(x, y, x1, y1, x2, y2){
    return (((x1 < x && x < x2) ||
            (x1 > x && x > x2)) &&
             ((y1 < y && y < y2) ||
             (y1 > y && y > y2)));
}

function download(filename, text) {
    var element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
    element.setAttribute('download', filename);
  
    element.style.display = 'none';
    document.body.appendChild(element);
  
    element.click();
  
    document.body.removeChild(element);
}

function moveToNext(str, startI, charGoal){
    var i = startI;
    while(i < str.length && str.charAt(i) != charGoal){
        i++;
    }
    return i;
}