import Grid from "./grid";
import Input from "./input";
import Object from "./object";
import Profile from "./func";
import Props from "./props";
import {Para} from "./func";
import {Func} from "./func";
import Timeline from "./time";

export default class Command{
    constructor(loopStart, canvas, svg){
        this.darkMode = true;
        //
        this.canvas = canvas;
        this.ctx = canvas.getContext("2d");
        this.svg = svg;
        //
        this.scrW = parseInt(this.svg.style("width"));//return screen width in pixels
        this.scrH = parseInt(this.svg.style("height"));//return screen height in pixels
        //
        this.grid = new Grid(this, this.ctx, this.svg, 0, 0.1, 15);
        this.grid.calcSize();//get scales and things
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
        this.vectorMode = 0;//status of vectors, 0 = hidden, 1 = velocity, 2 = acceleration
        //
        this.idCount = 0;
        //
        this.selected = null;
        this.objects = [];
        this.selectedIdxs = [];
        //
        this.timeline = new Timeline(this, document.getElementById('tcan'), d3.select("#tsvg"), 10);
        console.log(this.time.scrH);
        //
        this.input = new Input(this);
        this.props = new Props(this);
        //
        //this.para = new Para(this.time, 1, [1,4],[2,1,3],0,0);
        //
        this.a = 1;
        console.log(this.a);
        this.a +=1;
        console.log(this.a);
        //
        this.sels = [];
        this.selObs = [];
        //
        this.dragBox = this.svg.append("rect").style("stroke", "#47a3ff").style("fill", "#47d7ff").style("fill-opacity", .6).style("visibility", "hidden");
        //
        //this.func = new Func(1000, [1, 1]);
        //this.func.resolve([[31, 0, -2], [-1, 0, 0], [14, 1, 1], [38, 2, -2]]);
        //this.func.draw(this, -10, 10);
        this.moveGrid()
        //
        //this.func.approxMatrix([[4, 0, 0], [62, 0, -2], [6, 2, 0], [-54, 2, 2], [18, 3, 1]]);
        //this.func.approxMatrix([[-29, 0, -2], [-1, 0, 0], [3, 1, 1], [-40, 2, -2]]);
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
        this.drawGrid();
        this.moveGrid();
        this.moveSelects();
        this.moveExtremes()//add function to object to shift extreme point positions
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
        this.drawGrid();
        this.moveGrid();
        this.moveSelects();
        this.moveExtremes();
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
        this.drawGrid();
        this.moveGrid();
        this.moveExtremes();
        this.moveSelects();
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
    //#endregion
    //
    //#region Illustration
    //
    /**
     * redraw grid (canvas)
     */
    drawGrid(){
        this.grid.draw(this.ctx);
        this.objects.forEach(obj => {
            obj.draw(this.input);
        });
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
    updateGrid(objs){
        if(!objs){
            objs = this.objects;
        }
        //
        this.objects = this.objects.filter(obj => !obj.toBeDeleted);
        objs.forEach(obj => {
            obj.update();
        });
        this.moveSelects();
    }
    //
    /**
     * move all or some svg elements in timelin
     * @param {Array<Object>} [objs] list of objects to move
     */
    moveTimeline(objs){
        if(!objs){
            objs = this.objects;
        }
        //
        this.timeline.move();
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
        console.log("mode is " + mode);
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
        if(!objs){
            objs = this.objects;
        }
        //
        var objIds = [];
        objs.forEach(obj => {
            obj.spawnExtremes();
            objIds.push(this.objects.indexOf(obj));
        });
        this.timeline.spawnExtremes(objIds);
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
    moveExtremes(){
        this.objects.forEach(obj => {
            obj.movePoints();
        });
    }
    //
    deleteExtreme(obj){
        this.timeline.deleteExtreme(this.findIdxs([obj])[0]);
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
            idxs.push(this.objects.indexOf(obj));
        });
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
     */
    shiftPos(power, cx, cy, objs){
        objs.forEach(obj => {
            let x = this.scaleX.invert(this.scaleX(obj.xS[power]) + cx);
            let y = this.scaleY.invert(this.scaleY(obj.yS[power]) + cy);
            this.setPos(power, x, y, obj);
        });
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
    setTime(t){
        this.time = t;
        this.updateGrid();
        this.moveGrid();
        this.timeline.move();
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
        this.selected = this.input.active;
        this.selObs.push(this.input.active);
        this.objects.push(this.input.active);
        this.idCount++;
        this.select(this.selected);
        this.selected.self.raise();
        this.drawTimeline();
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
        }else if(!this.input.shifting){
            this.sels.forEach(sell => {
                sell.remove();
            });
            this.sels = [this.svg.append("circle").style("stroke", "#47a3ff").style("fill", "transparent").style("stroke-width", 4).style("stroke-opacity", .6)
                    .attr("r", 25)
                    .attr("cx", this.scaleX(obj.px))
                    .attr("cy", this.scaleY(obj.py))];
            this.selObs = [obj];
            obj.self.raise();
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
                console.log(this.selObs);
                console.log(this.sels);
                console.log(idx);
                this.selObs.splice(idx, 1);//remove select
                this.sels[idx].remove();
                this.sels.splice(idx, 1);
            }
        }else{//object had not been selected
            this.sels.push(this.svg.append("circle").style("stroke", "#47d7ff").style("stroke-width", 4).style("fill", "transparent").style("stroke-opacity", .6)
                            .attr("r", 25)
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
        this.select();
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
    }
    //#endregion
    //
    /*update(){//update entire field and redraw canvas
        this.objects = this.objects.filter(obj => !obj.toBeDeleted);
        this.draw();
        this.move();
    }
    //
    move(){
        this.selected = this.input.selected;
        this.objects.forEach(obj => {
            obj.update();
        });
        this.sels.forEach((sel, idx) => {
            sel.attr("cx", this.scaleX(this.selObs[idx].px));
            sel.attr("cy", this.scaleY(this.selObs[idx].py));
        });
        this.timeline.move();
    }
    //
    draw(){//redraw canvas
        this.grid.draw(this.ctx);
        this.objects.forEach(obj => {
            obj.draw(this.input);
        });
        this.timeline.draw();
        this.timeline.move();
    }
    //
    objUpdate(obj, inputMode){
        obj.update();
        this.draw();
        this.timeline.repoint();
        if(arguments.length < 2 || !inputMode){
            this.props.update(obj);
            this.props.retime();
        }
        this.select(obj);
        this.sels[0].attr("cx", this.scaleX(this.selObs[0].px)).attr("cy", this.scaleY(this.selObs[0].py));
    }
    //
    updateVectors(object, mode){
        if(arguments.length == 0){
            this.objects.forEach(obj => {
                obj.updateVectors(this.vectorMode);
            });
        }else{
            object.updateVectors(mode);
        }
    }
    //
    zoom(c, px , py){
        this.grid.zoom(c, px, py);
        this.update();
    }
    //
    repos(px, py){
        this.grid.repos(px, py);
        this.update();
        this.props.update(this.selected);
    }
    //
    shiftObj(cx, cy){
        var n = 0;
        this.selObs.forEach(obj => {
            //console.log("Calling repos");
            obj.rekey({power: 0, xShift: cx, yShift: cy});
            if(n == 0){
                //this.sel.attr("cx", )
            }
        });
        this.update();
        this.timeline.draw();
        this.timeline.repoint();
        this.props.update(this.selected);
    }
    //
    retime(dt, inputMode){
        this.time += dt;
        this.update();
        this.props.update(this.selected);
        if(arguments.length < 2 || !inputMode){//time directly set
            this.props.retime();
        }
    }
    setTime(time, inputMode = false){//same thing, just set instead of shift
        this.retime(time - this.time, inputMode);
    }
    //
    resize(){
        this.grid.resize();
        this.timeline.resize();
        this.update();
    }
    //
    newObject(px, py){
        this.input.moveState = 3;
        this.input.active = new Object(this, this.idCount, px, py);
        this.selected = this.input.active;
        this.selObs.push(this.input.active);
        this.objects.push(this.input.active);
        this.idCount++;
        this.select(this.selected);
        this.selected.self.raise();
    }*/
}

function inBounds(x, y, x1, y1, x2, y2){
    return (((x1 < x && x < x2) ||
            (x1 > x && x > x2)) &&
             ((y1 < y && y < y2) ||
             (y1 > y && y > y2)));
}