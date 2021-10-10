export default class Input{
    constructor(command){
        this.moveState = 0;//track when type, 0 = none, 1 = field move, 2 = object move, 3 = object position set, 4 = vector change, 5 = timeline change
        var adding = false;//track when add button is pressed
        //
        this.overState = 0;//track what the mouse is over, 0 = field, 1 = header, 2 = left column, 3= timeline
        //
        this.command = command;
        this.timeline = command.timeline;
        //
        this.selected = command.selected;
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
        let canox = parseInt(d3.select("#leftcolumn").style("width"));
        let canoy = parseInt(d3.select("#header").style("height"));
        //
        window.addEventListener("resize", event => {
            command.resize();
        });
        //
        document.addEventListener("wheel", event => {
            command.zoom(Math.pow(2.7, event.deltaY / 700), mX, mY);
        })
        //
        document.addEventListener("keydown", event => {
            switch(event.key){
                case "a":
                    if(!adding){
                        command.newObject(mX, mY);
                        input.active.repos(mX, mY);
                        adding = true;
                    }
                    break;
                case "ArrowRight":
                    command.retime(.1);
                    break;
                case "ArrowLeft":
                    command.retime(-.1);
                    break;
                case " ":
                    //console.log("Not working");
                    command.running = !command.running;
                    window.requestAnimationFrame(command.loopStart);
                    break;
                case "Backspace":
                    input.selected.delete();
                    break;
                case "l":
                    input.selected.toggleLock();
                    break;
            }
        });
        document.addEventListener("keyup", event => {
            switch(event.key){
                case "a":
                    adding = false;
                    break;
                case "v":
                    switch(command.vectorMode){
                        case 2:
                            command.vectorMode = 0;
                            break;
                        default:
                            command.vectorMode++;
                            break;
                    }
                    command.updateVectors();
                    break;
                case "Enter":
                    break;
            }
        })
        //
        command.svg.on("mousedown", function(){
            let mouse = d3.mouse(this);
            console.log(input.moveState);
            //
            if(input.moveState == 0){
                input.moveState = 1;
            }
            //
            stX = mouse[0];
            stY = mouse[1];
        });
        //
        document.addEventListener("mousemove", event => {
            var emx = event.clientX;
            var emy = event.clientY;
            emx -= parseInt(d3.select("#leftcolumn").style("width"));
            emy -= parseInt(d3.select("#header").style("height"));
            //
            switch(this.moveState){
                case 1:
                    command.repos(emx - mX, emy - mY);
                    break;
                case 2:
                    this.active.repos(emx, emy);
                    break;
                case 3: 
                    this.active.repos(emx, emy);
                    break;
                case 4:
                    this.active.reval(emx, emy);
                    break;
                case 5:
                    //console.log("why");
                    command.time = command.timeline.timeX.invert(event.clientX);
                    command.retime(0);
                    break;
                default:
                    break;
            }
            //
            //console.log(emy);
            mX = emx;
            mY = emy;
        });
        //
        document.addEventListener("mouseup", event => {//this is kinda broken
            if(this.moveState == 3){
                command.updateVectors(input.active, 1);
                this.moveState = 0;
                //input.velConf = true;
                this.active.nets[0].self.show();
                command.update();
            }else{
                this.moveState = 0;
            }
        });
        //
        this.timeline.svg.on("mousedown", function(){
            input.moveState = 5;
            command.time = command.timeline.timeX.invert(d3.mouse(this)[0]);
            command.retime(0);
            //console.log("huh");
        });
        //
    }
    //
    newObject(obj){
        var input = this;
        console.log("object clicked");
        obj.self.on("mousedown", function(){
            if(input.moveState == 0){
                input.moveState = 2;
            }
            input.active = obj;
            input.selected = obj;
            obj.command.retime(0);
        });
    }
    //
    newArrow(arrow){
        var input = this;
        arrow.self.head.on("mousedown", function(){
            if(input.moveState == 0){
                input.active = arrow;
                input.moveState = 4;
            }
        });
    }
}