/*
Ideal iniput layout:
    1. Resize
    2. Column resize
    3. wheel event
    4. 

To include: 
    - resize
    - column resize
    - wheel event
    - keydown, keyup
    - global mousedown
    - global mousemove
    - global mouseup
    - field mousedown
    - double click event
    - timeline mousedown
    - playback control buttons
    - file drag events
    - parametric/function controls
    - save and add buttons
no properties inputs
Groups:
    - resize events
    - key events
    - mouse events
    - button click events
*/

export default class Input{
    constructor(command){
        this.moveState = 0;//track when type, 0 = none, 1 = field move, 2 = object move, 3 = object position set, 4 = vector change, 5 = timeline change
        var adding = false;//track when add button is pressed
        this.shifting = false;
        this.controlling = false;
        //
        this.overState = 0;//track what the mouse is over, 0 = field, 1 = header, 2 = left column, 3= timeline
        //
        this.propsState = false;//is a props field selected
        this.propActive = null;
        //
        this.command = command;
        this.timeline = command.timeline;
        //
        this.active = null;
        //
        this.test = 1;
        var input = this;
        //
        var stX = 0;//starting grid position
        var stY = 0;
        var mX = 0;//current mouse position
        var mY = 0;
        var cs = 0;//current shift
        this.stcX = 0;//starting timeline position
        //
        var mT = null;//time mouse was pressed
        //
        this.tX = 0;
        this.tY = 0;
        //
        let canox = parseInt(d3.select("#leftcolumn").style("width")) + parseInt(d3.select("#lefthandle").style("width"));
        let canoy = parseInt(d3.select("#header").style("height"));
        //
        window.addEventListener("resize", event => {
            window.setTimeout(function(){command.resize();}, 50);//sometimes screen resizing takes a little bit
            command.props.windowResize();
            canox = parseInt(d3.select("#leftcolumn").style("width")) + parseInt(d3.select("#lefthandle").style("width"));
            canoy = parseInt(d3.select("#header").style("height"));//referencing the props values is susceptible to time delay
        });
        //
        d3.select("#fieldcolumn").on("wheel.zoom", function(){
            //console.log('zooming');
            d3.event.preventDefault();
            if(d3.event.shiftKey){
                command.zoomX(Math.pow(2.7, d3.event.deltaY / 700), mX, mY);
            }else{
                command.zoom(Math.pow(2.7, d3.event.deltaY / 700), mX, mY);
            }
        });
        //
        //d3.select("#fieldcolumn").on("pointerout", function(){console.log("going out")});
        d3.select("#fieldcolumn").on("touchstart", function(){d3.event.preventDefault()});
        //
        d3.select("#timeline").on("wheel.zoom", function(){
            d3.event.preventDefault();
            command.zoomTimeline(Math.pow(2.7, d3.event.deltaY / 700), mX + canox, mY);
        });
        //
        //#region key events
        //
        document.addEventListener("keydown", event => {
            d3.select('#arrowDisplayDrop').node().blur();
            switch(event.key){
                case "a":
                    if(!adding){
                        if(this.moveState == 3){//currently adding object
                            if(this.command.viewType == 0 && this.command.vectorMode != -1){
                                this.command.toggleVectors(1);
                            }else if(this.command.vectorMode == -1){
                                this.active.toggleVectors(-1);
                            }
                            this.moveState = 0;
                            this.command.drawGrid();
                            this.command.spawnExtremes([this.command.selected]);
                        }
                        command.newObject(mX, mY);
                        adding = true;
                    }
                    break;
                case "ArrowRight":
                    if(!this.propsState){
                        command.shiftTime(.1);
                    }
                    break;
                case "ArrowLeft":
                    if(!this.propsState){
                        command.shiftTime(-.1);
                    }
                    break;
                case "ArrowUp":
                    if(this.propsState){
                        event.preventDefault();
                    }
                    break;
                case " ":
                    event.preventDefault();
                    command.running = !command.running;
                    command.rate = 1;
                    if(command.running){
                        window.requestAnimationFrame(command.loopStart);
                        d3.select("#forpl").attr("class", "fas fa-pause");
                        d3.select("#backpl").attr("class", "fas fa-play");
                    }else{
                        d3.select("#forpl").attr("class", "fas fa-play");
                        d3.select("#backpl").attr("class", "fas fa-play");
                    }
                    break;
                case "Backspace":
                    if(!this.propsState){
                        this.command.selObs.forEach(obj => {
                            console.log("Deleting object");
                            obj.delete();
                        });
                        this.command.select();
                        this.command.spawnExtremes();
                    }
                    break;
                case "l":
                    /*this.command.selObs.forEach(obj => {
                        obj.toggleLock();
                    });*/
                    break;
                case "Enter":
                    if(this.propsState){
                        this.propActive.blur();
                        this.command.props.update(this.command.selected);
                        this.propsState = false;
                    }
                    break;
                case "Shift":
                    this.shifting = true;
                    break;
                case "Control":
                    this.controlling = true;
                    break;
                case "s":
                    if(event.ctrlKey){
                        event.preventDefault();
                        this.command.saveState();
                        return false;
                    }
                    break;
            }
        });
        //
        var delta = 500;
        var lastKeypressTime = 0;//to capture double key press
        //
        document.addEventListener("keyup", event => {
            switch(event.key){
                case "a":
                    adding = false;
                    break;
                case "v":
                    var thisKeypressTime = new Date();
                    if(thisKeypressTime - lastKeypressTime <= delta){
                        this.command.toggleVectors(-1);//show both velocity and acceleration
                    }else{
                        let newMode = command.vectorMode + 1;
                        if(newMode > command.highestVector){
                            newMode = 0;
                        }
                        this.command.toggleVectors(newMode);
                    }
                    //
                    d3.select(d3.select('#arrowDisplayDrop').selectAll('option').nodes()[command.vectorMode+1]).property('selected', 'selected');
                    //
                    lastKeypressTime = thisKeypressTime;
                    break;
                case "Enter":
                    break;
                case "Shift":
                    this.shifting = false;
                    this.command.dragBox.style("visibility", "hidden");
                    break;
                case "Control":
                    this.controlling = false;
                    break;
            }
        })
        //
        //#endregion
        //
        //#region mouse events
        //
        document.addEventListener("mousedown", event => {
            var emx = event.clientX;
            var emy = event.clientY;
            emx -= canox;
            emy -= canoy;
            //
            stX = emx;
            stY = emy;
            cs = 0;
            //
            mX = emx;
            mY = emy;
            mT = new Date();
        });
        //
        command.svg.on("mousedown", function(){
            input.propsState = false;
            //
            if(input.moveState == 0){
                input.moveState = 1;
            }
        });
        //
        this.timeline.svg.on("mousedown", function(){
            if(input.moveState == 0){
                if(!event.shiftKey){
                    command.setTime(command.timeline.timeX.invert(d3.mouse(this)[0]));
                }
                input.moveState = 5;
            }
        });
        //
        d3.select("#lefthandle").on("mousedown", function(){//start resizing the left column
            input.moveState = 8;
            d3.select(this).attr('class', 'columnhandle sel');
        });
        //
        document.addEventListener("mousemove", event => {
            var emx = event.clientX;
            var emy = event.clientY;
            emx -= canox;
            emy -= canoy;
            //
            switch(this.moveState){
                case 1://field move
                    if(event.shiftKey){
                        this.command.dragSelect(stX, stY, emx, emy);//drag select
                    }else{
                        this.command.shiftView(emx - mX, emy - mY);//move field
                    }
                    break;
                case 2://object move
                    if(event.ctrlKey){
                        //console.log('time snapping');
                        let pos = this.command.grid.getNearUnits(this.command.scaleX.invert(emx), this.command.scaleY.invert(emy));
                        let xPos = this.command.scaleX(pos[0]);
                        let yPos = this.command.scaleY(pos[1]);
                        //
                        this.command.setScreenPos(0, xPos, yPos, this.command.selObs);//move object(s)
                        this.command.objPosChange(this.command.selObs);//update corresponding displays
                    }else{
                        this.command.shiftPos(0, emx - mX, emy - mY, this.command.selObs);//move object(s)
                        this.command.objPosChange(this.command.selObs);//update corresponding displays
                    }
                    break;
                case 3://set initial object value
                    switch(this.command.viewType){
                        case 0:
                            this.active.setValue(0, this.command.scaleX.invert(emx), this.command.scaleY.invert(emy));
                            break;
                        case 1:
                            this.command.setTime(this.command.scaleX.invert(emx));
                            this.active.setValue(0, this.command.scaleY.invert(emy), 0);
                            break;
                        case 2:
                            this.command.setTime(this.command.scaleX.invert(emx));
                            this.active.setValue(0, 0, this.command.scaleY.invert(emy));
                            break;
                    }
                    this.command.updateGrid([this.active]);
                    this.command.moveGrid([this.active]);
                    break;
                case 4://change arrow values
                    this.active.reval(emx, emy);
                    break;
                case 5://set the time via timeline
                    if(event.shiftKey){
                        command.timeline.shiftPos(command.timeline.conTime(emx - mX));
                        command.drawTimeline();
                        command.moveTimeline();
                        command.retimeExtremes();
                    }else{
                        command.setTime(command.timeSnapping || event.ctrlKey ? command.timeline.getNearTime(command.timeline.timeX.invert(event.clientX)) : command.timeline.timeX.invert(event.clientX));
                    }
                    break;
                case 6://retime an object via timeline extremes
                    if(new Date - mT > 300){//if mouse has been held long enough (so no accidents)
                        //this.command.selected.setValueTime(0, command.timeline.timeX.invert(event.clientX), this.tX, this.tY);
                        if(command.timeSnapping || event.ctrlKey){
                            cs = command.selected.profile.setAllPieces(this.strX, cs, command.timeline.getNearTime(command.timeline.timeX.invert(event.clientX)));
                        }else{
                            //this.command.selected.profile.shiftPropagate(command.timeline.timeX.invert(event.clientX), command.timeline.conTime(emx - mX));
                            this.command.selected.profile.shiftAllPieces(command.timeline.conTime(emx - mX));
                            this.strX += command.timeline.conTime(emx - mX);
                        }
                        //this.command.selected.profile.reBoundLeftPiece()
                        command.props.retime();
                        command.updateGrid();
                        command.drawGrid();
                        command.moveGrid();
                        command.timeline.movePoints();
                        if(command.viewType != 0){
                            command.moveExtremes();
                        }
                    }
                    break;
                case 7:
                    break;//do nothing
                case 8://resize left column
                    if(event.stopPropagation) event.stopPropagation();
                    if(event.preventDefault) event.preventDefault();
                    event.cancelBubble=true;
                    command.props.columnResize(event.clientX);
                    canox = command.props.canox;
                    break;
                case 9://move object by extreme
                    this.propActive += command.grid.conX(emx - mX);
                    if(event.ctrlKey){
                        //console.log('time snapping');
                        let pos = this.command.grid.getNearUnits(this.command.scaleX.invert(emx), this.command.scaleY.invert(emy));
                        console.log(pos);
                        let xPos = this.command.scaleX(pos[0]);
                        let yPos = this.command.scaleY(pos[1]);
                        console.log(`xPos: ${xPos}, yPos: ${yPos}`);
                        //
                        this.command.setScreenPos(0, xPos, yPos, [this.active], this.propActive);//move object(s)
                        this.command.objPosChange([this.active]);//update corresponding displays
                    }else{
                        this.command.shiftPos(0, emx - mX, emy - mY, [this.active], this.propActive);//move object
                        this.command.objPosChange([this.active]);//update corresponding displays
                    }
                    break;
                default://regular mouse movement
                    //command.drawGrid();
                    break;
            }
            //
            //console.log(this.moveState);
            mX = emx;
            mY = emy;
        });
        //
        document.addEventListener("mouseup", event => {//this is kinda broken
            if(this.moveState == 3){//position has been confirmed
                if(this.command.viewType == 0){
                    this.command.toggleVectors(this.command.vectorMode);
                }
                this.moveState = 0;
                this.command.drawGrid();
                this.command.spawnExtremes([this.command.selected]);
            }else if((mX - Math.ceil(stX) == 0) && (mY - Math.ceil(stY) == 0)){//no movement (y start has to be rounded for some reason)
                switch(this.moveState){
                    case 1://field move
                        if(!event.shiftKey){//shift click only deselects currently selected items
                            this.command.select();
                            this.active = null;
                            this.command.selected = null;
                            this.command.props.update();
                        }
                        break;
                    case 2://object move
                        if(new Date - mT > 300 && command.selObs.length > 1){//long click main selects object
                            this.command.mainSelect(input.active);
                        }else{
                            this.command.select(this.command.selected);
                            this.command.selected.self.raise();
                        }
                        break;
                    case 5://only necessary if the time isn't set on the mousedown
                        //command.setTime(command.timeline.timeX.invert(event.clientX));
                        break;
                    case 6:
                        this.command.time = (parseFloat(this.active.attr("val")));
                        command.timeline.move();
                        command.updateGrid();
                        command.moveGrid();
                        command.timeline.movePoints();
                        command.props.retime();
                        break;
                }
            }
            //
            if(input.moveState != 7 && input.propsState){
                input.command.props.update(input.command.selected);
                input.propsState = false;
            }else if(input.propsState){
                //input.propActive.select();
            }
            //
            if(command.autoScale && this.moveState > 1){//this needs to be more picky
                command.grid.normalize();
            }
            //
            if(input.moveState == 1 && event.shiftKey && command.selObs.length == 1){//drag select selected only one object
                input.shifting = false;
                console.log(`selecting object ${command.selObs[0].id}`);
                command.select(command.selObs[0]);
            }
            //
            d3.select('#lefthandle').attr('class', 'columnhandle');
            //
            this.command.dragBox.style("visibility", "hidden");
            this.command.props.renderEqs();
            this.moveState = 0;
        });
        //
        document.addEventListener('dblclick', function (e) {
            input.command.spawnExtremes();
            input.timeline.colorPoints(input.command.findIdxs(input.command.objects));
        });
        //
        //#endregion
        //
        //#region buttons
        //
        d3.select("#forplay").on("mousedown", function(){
            if(!command.running || command.rate == 1){
                command.running = !command.running;
            }
            command.rate = 1;
            if(command.running){
                window.requestAnimationFrame(command.loopStart);
                d3.select("#forpl").attr("class", "fas fa-pause");
                d3.select("#backpl").attr("class", "fas fa-play");
            }else{
                d3.select("#forpl").attr("class", "fas fa-play");
            }
        });
        //
        d3.select("#backplay").on("mousedown", function(){
            if(!command.running || command.rate == -1){
                command.running = !command.running;
            }
            command.rate = -1;
            if(command.running){
                window.requestAnimationFrame(command.loopStart);
                d3.select("#backpl").attr("class", "fas fa-pause");
                d3.select("#forpl").attr("class", "fas fa-play");
            }else{
                d3.select("#backpl").attr("class", "fas fa-play");
            }
        });
        //
        d3.select("#stepforward").on("mousedown", function(){
            command.setTime(command.timeline.getNextTime(command.time, true));
        });
        //
        d3.select("#stepback").on("mousedown", function(){
            command.setTime(command.timeline.getNextTime(command.time, false));
        });
        //
        d3.select("#vt0").on("mousedown", function(){
            d3.select('#vt0').attr("class", "vectorButton seld");
            d3.select('#vt1').attr("class", "vectorButton");
            d3.select('#vt2').attr("class", "vectorButton");
            //
            input.command.changeViewType(0);
        });
        d3.select("#vt1").on("mousedown", function(){
            d3.select('#vt0').attr("class", "vectorButton");
            d3.select('#vt1').attr("class", "vectorButton seld");
            d3.select('#vt2').attr("class", "vectorButton");
            //
            input.command.changeViewType(1);
        });
        d3.select("#vt2").on("mousedown", function(){
            d3.select('#vt0').attr("class", "vectorButton");
            d3.select('#vt1').attr("class", "vectorButton");
            d3.select('#vt2').attr("class", "vectorButton seld");
            //
            input.command.changeViewType(2);
        });
        //
        d3.select("#save").on("mousedown", function(){
            input.command.saveState();
        });
        //
        //#endregion
        //
        var dropbox = document.getElementById("getFile");
        document.addEventListener("dragenter", e => {
            if(window.getSelection().isCollapsed && window.getSelection().type != "Range"){//prevent false dragging events
                d3.select("#getFile").style("pointer-events", "all").style("opacity", "0.5");
                e.stopPropagation();
                e.preventDefault();
            }
        }, false);
        dropbox.addEventListener("dragleave", e => {
            d3.select("#getFile").style("pointer-events", "none").style("opacity", "0");
            fake = false;
        }, false);
        dropbox.addEventListener("dragover", e => {
            e.stopPropagation();
            e.preventDefault();
        }, false);
        //
        dropbox.addEventListener("drop", e => {
            e.stopPropagation();
            e.preventDefault();
            //
            const dt = e.dataTransfer;
            const files = dt.files;
            //
            this.command.openState(files[0]);
            d3.select("#getFile").style("pointer-events", "none").style("opacity", "0");
        }, false);
        //
        //#region bounding
        d3.select('#leftTimeBound').on('click', function(){
            this.select();
            input.fieldClick(this);
        });
        //
        d3.select('#rightTimeBound').on('click', function(){
            this.select();
            input.fieldClick(this);
        });
        //
        d3.select('#leftTimeBound').on('input', function(){
            if(isNumeric(this.value)){
                input.timeline.setSizeByEdge({left: parseFloat(this.value)});
                command.drawTimeline();
                command.moveTimeline();
                command.retimeExtremes();
            }
        });
        //
        d3.select('#rightTimeBound').on('input', function(){
            if(isNumeric(this.value)){
                input.timeline.setSizeByEdge({right: parseFloat(this.value)});
                command.drawTimeline();
                command.moveTimeline();
                command.retimeExtremes();
            }
        });
        //
        d3.select(`#x1Bound`).on('click', function(){
            this.select();
            input.fieldClick(this);
        });
        //
        d3.select(`#x2Bound`).on('click', function(){
            this.select();
            input.fieldClick(this);
        });
        //
        d3.select(`#y1Bound`).on('click', function(){
            this.select();
            input.fieldClick(this);
        });
        //
        d3.select(`#y2Bound`).on('click', function(){
            this.select();
            input.fieldClick(this);
        });
        //
        d3.select(`#x1Bound`).on('input', function(){
            if(isNumeric(this.value) && parseFloat(this.value) < command.scaleX.domain()[1]){
                command.grid.setSizeByEdge({left: parseFloat(this.value)});
                command.autoScale = false;
                d3.select('#autoScaleCheck').property('checked', false);
            }
        });
        //
        d3.select(`#x2Bound`).on('input', function(){
            if(isNumeric(this.value) && parseFloat(this.value) > command.scaleX.domain()[0]){
                command.grid.setSizeByEdge({right: parseFloat(this.value)});
                command.autoScale = false;
                d3.select('#autoScaleCheck').property('checked', false);
            }
        });
        //
        d3.select(`#y1Bound`).on('input', function(){
            if(isNumeric(this.value) && parseFloat(this.value) < command.scaleY.domain()[1]){
                command.grid.setSizeByEdge({bottom: parseFloat(this.value)});
                command.autoScale = false;
                d3.select('#autoScaleCheck').property('checked', false);
            }
        });
        //
        d3.select(`#y2Bound`).on('input', function(){
            if(isNumeric(this.value) && parseFloat(this.value) > command.scaleY.domain()[0]){
                command.grid.setSizeByEdge({top: parseFloat(this.value)});
                command.autoScale = false;
                d3.select('#autoScaleCheck').property('checked', false);
            }
        });
        //#endregion
        //
        d3.select('#arrowDisplayDrop').on('change', function(){
            let newSelect = 0;
            let arrowOptions = d3.select('#arrowDisplayDrop').selectAll('option').nodes();
            while(d3.select(arrowOptions[newSelect]).property('selected') != true){
                newSelect++;
            }
            //
            command.toggleVectors(newSelect - 1);
        });
    }
    //
    newPoint(point){
        var input = this;
        let id = parseInt(point.attr("ob"));
        let idx = input.command.objects.findIndex(obj => obj.id == id);//find index of parent object
        let object = input.command.objects[idx];//store parent object
        //
        point.on("mousedown", function(){
            input.moveState = 6;
            input.command.selected = object;
            input.active = point;
            input.command.select(object);
            if(object.lock){
                object.toggleLock();
            }
            //
            input.strX = parseFloat(point.attr("val"));
            input.tX = object.profile.calc(0, parseFloat(point.attr("val")))[0];
            input.tY = object.profile.calc(0, parseFloat(point.attr("val")))[1];
            object.profile.setOrigin(parseFloat(point.attr("val")));
        });
        //
        point.on("mouseenter", function(){
            point.attr("r", 6);
        });
        //
        point.on("mouseleave", function(){
            point.attr("r", 5);
        });
    }
    //
    newObjPoint(obj, point){
        var input = this;
        let color = point.style("fill");
        let pointLabel = null;
        point.on("mouseenter", function(){
            point.attr("r", 7);
        });
        //
        point.on("mouseleave", function(){
            point.attr("r", 6);
        });
        //
        point.on("mousedown", function(){
            if(point.style("fill") == "white"){
                point.style("fill", color);
                let labell = obj.pointDiv.selectAll(`.pointLabel[val='${point.attr("val")}']`).nodes();
                if(labell.length > 0){
                    d3.select(labell[0]).remove();
                }
            }else{
                point.style("fill", "white");
                ////<div class="pointLabel"><p class="text">\(1.23, 4.56\)</p></div>
                console.log(parseInt(obj.pointDiv.style('width')) / 2);
                let pos = obj.profile.calc(0, parseFloat(point.attr("val")));
                pointLabel = obj.pointDiv.append("div").attr("class", "pointLabel").attr("val", point.attr("val"));
                pointLabel
                    .append("p").attr("class", "text")
                    .text(`${round(pos[0], 3)}, ${round(pos[1], 3)}`);
                pointLabel
                    .style("left", `${point.attr("cx") - (parseInt(pointLabel.style('width')) / 2)}px`)
                    .style("top", `${point.attr("cy") - (parseInt(pointLabel.style('height'))) - 10}px`);
            }
            input.moveState = 9;
            input.active = obj;
            input.propActive = parseFloat(point.attr("val"));
            obj.profile.setOrigin(input.propActive);
            input.command.select(obj);
            input.timeline.colorPoints(input.command.findIdxs([obj]));
        });
    }
    //
    newObject(obj){
        var input = this;
        //console.log("object clicked");
        obj.self.on("mousedown", function(){//when object clicked
            input.active = obj;
            input.command.selected = obj;
            if(input.moveState == 0){//this is here for a reason, idiot
                input.command.selected.profile.setOrigin(input.command.time);
                input.moveState = 2;
            }
            if(input.shifting){//shift key is pressed
                //console.log("Shifting");
                input.command.shiftSelect(obj);
                if(!input.command.selObs.includes(obj)){
                    input.moveState = 0;
                }
            }else if(input.command.selObs.length <= 1){//only one object selected
                //console.log("Raising");
                input.command.select(obj);
            }else{//multiple objects selected
                //console.log("Remaining");
                input.command.mainSelect(obj);
            }
            input.command.selObs.forEach(obj => {
                //obj.profile.setOrigin(input.command.time);
                obj.profile.setRollingOrigin(input.command.time, 0);
            });
        });
        //
        obj.self.on("dblclick", function(){//this isn't working
            console.log("object double");
        });
    }
    //
    newArrow(arrow){
        var input = this;
        arrow.self.head.on("mousedown", function(){
            if(input.moveState == 0){
                input.active = arrow;
                input.command.select(arrow.obj);
                input.moveState = 4;
            }
        });
    }
    //
    fieldClick(elem){
        this.propsState = true;
        this.propActive = elem;
        this.moveState = 7;
    }
    //
    valueUpdate(power){
        this.command.updateGrid([this.command.selected], true);
        this.command.funcChange([this.command.selected]);
        this.command.selected.respawnArrows();
        this.command.selected.updateVectors(power);
        this.command.selected.moveVectors(power);
        this.command.props.renderEqs();
    }
}

function round(number, places){
    return Math.round(Math.pow(10, places) * number) / Math.pow(10, places);
}

function isNumeric(str) {
    if (typeof str != "string") return false // we only process strings!  
    return !isNaN(str) && // use type coercion to parse the _entirety_ of the string (`parseFloat` alone does not do this)...
           !isNaN(parseFloat(str)) // ...and ensure strings of whitespace fail
}