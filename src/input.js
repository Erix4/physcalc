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
        var stX = 0;
        var stY = 0;
        var mX = 0;
        var mY = 0;
        //
        this.tX = 0;
        this.tY = 0;
        //
        let canox = parseInt(d3.select("#leftcolumn").style("width")) + parseInt(d3.select("#lefthandle").style("width"));
        let canoy = parseInt(d3.select("#header").style("height"));
        //
        //#region resizing
        //
        let headerHeight = parseFloat(d3.select('#header').style('height'));//initial state
        let columnWidth = parseFloat(d3.select('#leftcolumn').style('width'));
        let screenRatio = window.innerWidth / window.innerHeight;
        console.log(columnWidth);
        const RATIOTHRESHOLD = 0.9;
        //
        //adjust header font-size and hide field by screen ratio
        if(screenRatio > RATIOTHRESHOLD){//horizontal
            d3.select('#title').style('font-size', `${headerHeight * 0.9}px`);
            d3.select('#title').style('margin-left', `${headerHeight / 8}px`);
        }else{//vertical
            d3.select('#title').style('font-size', `${headerHeight * 0.4}px`);
            d3.select('#title').style('margin-left', `${headerHeight / 8}px`);
            d3.select('#leftcolumn').style('width', '100%');
            d3.select('#fieldcolumn').style('display', 'none');
            d3.select('#lefthandle').style('display', 'none');
            columnWidth = window.innerWidth;
        }
        //
        d3.select('#leftcolumn').style('font-size', `${columnWidth / 10}px`);//adjust left column font size
        fitWidth(columnWidth);//fit the input fields to the width of the left column
        fitSolve(columnWidth);
        //
        window.addEventListener("resize", event => {
            console.log("resize event");
            if (screen.width == window.innerWidth && screen.height == window.innerHeight) {
                console.log("full screen");
             }             
            command.resize();
            canox = parseInt(d3.select("#leftcolumn").style("width")) + parseInt(d3.select("#lefthandle").style("width"));
            canoy = parseInt(d3.select("#header").style("height"));
            //
            headerHeight = parseFloat(d3.select('#header').style('height'));
            screenRatio = window.innerWidth / window.innerHeight;
            if(screenRatio > RATIOTHRESHOLD){//horizontal
                d3.select('#title').style('font-size', `${headerHeight * 0.9}px`);
                d3.select('#title').style('margin-left', `${headerHeight / 8}px`);
                d3.select('#leftcolumn').style('width', '25%');
                d3.select('#fieldcolumn').style('display', 'flex');
                d3.select('#lefthandle').style('display', 'block');
                columnWidth = window.innerWidth * 0.25;
            }else{//vertical
                d3.select('#title').style('font-size', `${headerHeight * 0.4}px`);
                d3.select('#title').style('margin-left', `${headerHeight / 8}px`);
                d3.select('#leftcolumn').style('width', '100%');
                d3.select('#fieldcolumn').style('display', 'none');
                d3.select('#lefthandle').style('display', 'none');
                columnWidth = window.innerWidth;
            }
            d3.select('#leftcolumn').style('font-size', `${columnWidth / 10}px`);
            d3.select('#leftcolumn').style('width', `${columnWidth}px`);
            d3.select('#fieldcolumn').style('width', `${window.innerWidth - columnWidth}px`);
            fitWidth(columnWidth);
            fitSolve(columnWidth);
        });
        //
        ["fullscreenchange", "webkitfullscreenchange", "mozfullscreenchange", "msfullscreenchange"].forEach(
            eventType => document.addEventListener(eventType, event => {
            console.log("Full screen detected");
            command.resize();
            canox = parseInt(d3.select("#leftcolumn").style("width")) + parseInt(d3.select("#lefthandle").style("width"));
            canoy = parseInt(d3.select("#header").style("height"));
            //
            headerHeight = parseFloat(d3.select('#header').style('height'));
            screenRatio = window.innerWidth / window.innerHeight;
            if(screenRatio > RATIOTHRESHOLD){//horizontal
                d3.select('#title').style('font-size', `${headerHeight * 0.9}px`);
                d3.select('#title').style('margin-left', `${headerHeight / 8}px`);
                d3.select('#leftcolumn').style('width', '25%');
                d3.select('#fieldcolumn').style('display', 'flex');
                d3.select('#lefthandle').style('display', 'block');
                columnWidth = window.innerWidth * 0.25;
            }else{//vertical
                d3.select('#title').style('font-size', `${headerHeight * 0.4}px`);
                d3.select('#title').style('margin-left', `${headerHeight / 8}px`);
                d3.select('#leftcolumn').style('width', '100%');
                d3.select('#fieldcolumn').style('display', 'none');
                d3.select('#lefthandle').style('display', 'none');
                columnWidth = window.innerWidth;
            }
            d3.select('#leftcolumn').style('font-size', `${columnWidth / 10}px`);
            d3.select('#leftcolumn').style('width', `${columnWidth}px`);
            d3.select('#fieldcolumn').style('width', `${window.innerWidth - columnWidth}px`);
            fitWidth(columnWidth);
            fitSolve(columnWidth);
        }));
          
        //
        //#endregion
        //
        document.addEventListener("wheel", event => {
            if(event.clientX > canox){
                if(mY < this.command.scrH){
                    if(event.shiftKey){
                        command.zoomX(Math.pow(2.7, event.deltaY / 700), mX, mY);
                    }else{
                        command.zoom(Math.pow(2.7, event.deltaY / 700), mX, mY);
                    }
                }else{
                    command.zoomTimeline(Math.pow(2.7, event.deltaY / 700), event.clientX, mY);
                }
            }
        });
        //
        //#region key events
        //
        document.addEventListener("keydown", event => {
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
                    this.command.selObs.forEach(obj => {
                        obj.toggleLock();
                    })
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
                        if(newMode == 3){
                            newMode = 0;
                        }
                        this.command.toggleVectors(newMode);
                    }
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
        document.addEventListener("mousedown", function(){
            var emx = event.clientX;
            var emy = event.clientY;
            emx -= parseInt(d3.select("#leftcolumn").style("width")) + parseInt(d3.select("#lefthandle").style("width"));
            emy -= parseInt(d3.select("#header").style("height"));
            //
            stX = emx;
            stY = emy;
            //
            mX = emx;
            mY = emy;
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
                command.setTime(command.timeline.timeX.invert(d3.mouse(this)[0]));
                input.moveState = 5;
            }
        });
        //
        d3.select("#lefthandle").on("mousedown", function(){//start resizing the left column
            input.moveState = 8;
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
                    this.command.shiftPos(0, emx - mX, emy - mY, this.command.selObs);//move object(s)
                    this.command.objPosChange(this.command.selObs);//update corresponding displays
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
                        command.timeline.shiftPos(emx - mX);
                    }else{
                        command.setTime(command.timeline.timeX.invert(event.clientX));
                    }
                    break;
                case 6://retime an object via timeline extremes
                    this.command.selected.setValueTime(0, command.timeline.timeX.invert(event.clientX), this.tX, this.tY);
                    command.updateGrid();
                    command.drawGrid();
                    command.moveGrid();
                    command.timeline.movePoints();
                    if(command.viewType != 0){
                        command.moveExtremes();
                    }
                    break;
                case 7:
                    break;//do nothing
                case 8://resize left column
                    let newX = event.clientX;
                    if(newX - 130 > getExtra() && window.innerWidth - newX > getField()){
                        d3.select('#leftcolumn').style('width', `${newX}px`);
                        d3.select('#fieldcolumn').style('width', `${window.innerWidth - newX}px`);
                        //initalX = newX;
                        columnWidth = parseFloat(d3.select('#leftcolumn').style('width'));
                        fitWidth(columnWidth);
                        fitSolve(columnWidth);
                        command.resize();
                        canox = parseInt(d3.select("#leftcolumn").style("width")) + parseInt(d3.select("#lefthandle").style("width"));
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
                if(this.command.viewType == 0 && this.command.vectorMode != -1){
                    this.command.toggleVectors(1);
                }else if(this.command.vectorMode == -1){
                    this.active.toggleVectors(-1);
                }
                this.moveState = 0;
                this.command.drawGrid();
                this.command.spawnExtremes([this.command.selected]);
            }else if((mX - Math.ceil(stX) == 0) && (mY - Math.ceil(stY) == 0)){//no movement (y start has to be rounded for some reason)
                switch(this.moveState){
                    case 1:
                        this.command.select();
                        this.active = null;
                        this.command.selected = null;
                        this.command.props.update();
                        break;
                    case 2:
                        this.command.select(this.command.selected);
                        this.command.selected.self.raise();
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
        d3.select("#saveB").on("mousedown", function(){
            input.command.saveState();
        });
        //
        //#endregion
        //
        var dropbox = document.getElementById("getFile");
        document.addEventListener("dragenter", e => {
            if(window.getSelection().anchorNode == null){
                d3.select("#getFile").style("pointer-events", "all").style("opacity", "0.5");
                e.stopPropagation();
                e.preventDefault();
            }
        }, false);
        dropbox.addEventListener("dragleave", e => {
            console.log("drag left");
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
            console.log("Drop detected");
            //
            const dt = e.dataTransfer;
            const files = dt.files;
            //
            this.command.openState(files[0]);
            d3.select("#getFile").style("pointer-events", "none").style("opacity", "0");
        }, false);
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
            console.log("point click detected");
            input.command.selected = object;
            input.active = point;
            input.command.select(object);
            if(object.lock){
                object.toggleLock();
            }
            //
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
            input.moveState = 2;
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
                obj.profile.setOrigin(input.command.time);
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

function getWidth(id){//get width of any element, including margins
    let elem = d3.select(id);
    return parseFloat(elem.style('width')) + parseFloat(elem.style('margin-left')) + parseFloat(elem.style('margin-right'));
}

function getExtra(){//get the width of the non-field elements of the values section
    return getWidth('.expandCompIcon') + (2 * getWidth('.propParaLabel')) + (2 * getWidth('.propdrop')) + parseFloat(d3.select('.valueContents').style('padding-left')) + 10;
}

function getCalc(){//get the width of the non-field elements of the solver section
    return (2 * getWidth('.checkbox')) + (2 * getWidth('.readCalcLabel')) + (2 * getWidth('.readCalcDrop')) + parseFloat(d3.select('.valueContents').style('padding-left')) + 10;
}

function getField(){//get the width of the field
    if(d3.select('#settings').style('display') == 'none'){
        return getWidth('#leftfield') + 10;
    }else{
        return parseFloat(d3.select('#settings').style('width')) + getWidth('#leftfield') + 10;
    }
}

function fitWidth(columnWidth){//fit the input fields to the width of the left column
    let labelWidth = getExtra();
    let fieldWidth = (columnWidth - labelWidth) / 2;
    //
    d3.selectAll('.fitWidth').style('width', `${fieldWidth}px`);
}

function fitSolve(columnWidth){//fit the input fields in the solve section
    let labelWidth = getCalc();
    let fieldWidth = (columnWidth - labelWidth) / 2;
    //
    d3.selectAll('.solveInput').style('width', `${fieldWidth}px`);
}