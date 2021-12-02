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
        let canox = parseInt(d3.select("#leftcolumn").style("width"));
        let canoy = parseInt(d3.select("#header").style("height"));
        //
        window.addEventListener("resize", event => {
            command.resize();
        });
        //
        document.addEventListener("wheel", event => {
            if(mY < this.command.scrH){
                if(event.shiftKey){
                    command.zoomX(Math.pow(2.7, event.deltaY / 700), mX, mY);
                }else{
                    command.zoom(Math.pow(2.7, event.deltaY / 700), mX, mY);
                }
            }else{
                command.zoomTimeline(Math.pow(2.7, event.deltaY / 700), event.clientX, mY);
            }
        })
        //
        document.addEventListener("keydown", event => {
            switch(event.key){
                case "a":
                    if(!adding){
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
        document.addEventListener("mousemove", event => {
            var emx = event.clientX;
            var emy = event.clientY;
            emx -= parseInt(d3.select("#leftcolumn").style("width")) + parseInt(d3.select("#lefthandle").style("width"));
            emy -= parseInt(d3.select("#header").style("height"));
            //console.log(this.moveState);
            //
            switch(this.moveState){
                case 1://field move
                    if(this.shifting){
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
                    if(this.shifting){
                        //
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
                    this.command.toggleVectors(1);
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
                input.propActive.select();
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
        this.timeline.svg.on("mousedown", function(){
            if(input.moveState == 0){
                command.setTime(command.timeline.timeX.invert(d3.mouse(this)[0]));
                input.moveState = 5;
            }
        });
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
        var dropbox = document.getElementById("getFile");
        document.addEventListener("dragenter", e => {
            console.log("drag entered");
            d3.select("#getFile").style("pointer-events", "all").style("opacity", "0.5");
            e.stopPropagation();
            e.preventDefault();
        }, false);
        dropbox.addEventListener("dragleave", e => {
            console.log("drag left");
            d3.select("#getFile").style("pointer-events", "none").style("opacity", "0");
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
            }else{
                point.style("fill", "white");
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
    props(command, self){
        var input = this;
        self.t.on("mousedown", function(){
            input.fieldClick(this);
        });
        self.posx.on("mousedown", function(){
            input.fieldClick(this);
        });
        self.posy.on("mousedown", function(){
            input.fieldClick(this);
        });
        self.velx.on("mousedown", function(){
            input.fieldClick(this);
        });
        self.vely.on("mousedown", function(){
            input.fieldClick(this);
        });
        self.accelx.on("mousedown", function(){
            input.fieldClick(this);
        });
        self.accely.on("mousedown", function(){
            input.fieldClick(this);
        });
        self.jerkx.on("mousedown", function(){
            input.fieldClick(this);
        });
        self.jerky.on("mousedown", function(){
            input.fieldClick(this);
        });
        //
        self.t.on("input", function(){
            if(isNumeric(this.value)){
                command.setTime(parseFloat(this.value), true);
            }
        });
        //
        self.posx.on("input", function(){
            if(isNumeric(this.value)){
                command.selected.setValue(0, parseFloat(this.value), command.selected.py);
                command.objPosChange([command.selected], true);
                input.command.props.renderEqs();
            }
        });
        //
        self.posy.on("input", function(){
            if(isNumeric(this.value)){
                command.selected.setValue(0, command.selected.px, parseFloat(this.value));
                command.objPosChange([command.selected], true);
                input.command.props.renderEqs();
            }
        });
        //
        self.velx.on("input", function(){
            if(isNumeric(this.value)){
                command.selected.setValue(1, parseFloat(this.value), parseFloat(self.vely.property("value")));
                input.valueUpdate(1);
            }
        });
        //
        self.vely.on("input", function(){
            if(isNumeric(this.value)){
                command.selected.setValue(1, parseFloat(self.velx.property("value")), parseFloat(this.value));
                input.valueUpdate(1);
            }
        });
        //
        self.accelx.on("input", function(){
            if(isNumeric(this.value)){
                command.selected.setValue(2, parseFloat(this.value), parseFloat(self.accely.property("value")));
                input.valueUpdate(2);
            }
        });
        //
        self.accely.on("input", function(){
            if(isNumeric(this.value)){
                command.selected.setValue(2, parseFloat(self.accelx.property("value")), parseFloat(this.value));
                input.valueUpdate(2);
            }
        });
        //
        self.jerkx.on("input", function(){
            if(isNumeric(this.value)){
                console.log(`Val: ${this.value}, parsed: ${parseFloat(this.value)}`);
                command.selected.setValue(3, parseFloat(this.value), parseFloat(self.jerky.property("value")));
                input.valueUpdate(3);
            }
        });
        //
        self.jerky.on("input", function(){
            if(isNumeric(this.value)){
                command.selected.setValue(3, parseFloat(self.jerkx.property("value")), parseFloat(this.value));
                input.valueUpdate(3);
            }
        });
        //
        self.calcB.on("mousedown", function(){
            console.log("Hello!");
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

function isNumeric(str) {
    if (typeof str != "string") return false // we only process strings!  
    return !isNaN(str) && // use type coercion to parse the _entirety_ of the string (`parseFloat` alone does not do this)...
           !isNaN(parseFloat(str)) // ...and ensure strings of whitespace fail
}