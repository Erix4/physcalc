export default class Input{
    constructor(command){
        this.moveState = 0;//track when type, 0 = none, 1 = field move, 2 = object move, 3 = object position set, 4 = vector change
        this.velConf = false;//track if velocity is confirmed (or being confirmed)
        var adding = false;//track when add button is pressed
        //
        this.active;
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
                        if(this.velConf){
                            //command.updateVectors(this.active, command.vectorMode);
                        }
                        command.newObject(mX, mY);
                        input.active.repos(mX, mY);
                        adding = true;
                    }
                    break;
                case "1":
                    command.time = 1;
                    command.update();
            }
        });
        document.addEventListener("keyup", event => {
            switch(event.key){
                case "a":
                    adding = false;
                    break;
                case "v":
                    if(this.velConf){
                        if(this.active.vectorMode == 1){
                            //command.updateVectors(this.active, 2);
                        }else{
                            //command.updateVectors(this.active, 1);
                        }
                    }else{
                        switch(command.vectorMode){
                            case 2:
                                command.vectorMode = 0;
                                break;
                            default:
                                command.vectorMode++;
                                break;
                        }
                        //command.updateVectors();
                    }
                    break;
                case "Enter":
                    if(this.velConf){
                        this.velConf = false;
                        //command.updateVectors(this.active, command.vectorMode);
                        command.update();
                    }
                    break;
            }
        })
        //
        command.svg.on("mousedown", function(){
            let mouse = d3.mouse(this);
            //
            if(input.moveState == 0){
                input.moveState = 1;
            }
            //
            stX = mouse[0];
            stY = mouse[1];
        });
        //
        d3.select("svg").on("mousemove", function(){
            let mouse = d3.mouse(this);
            //
            switch(input.moveState){
                case 1:
                    command.repos(mouse[0] - mX, mouse[1] - mY);
                    break;
                case 2:
                    input.active.repos(mouse[0], mouse[1]);
                    break;
                case 3: 
                    input.active.repos(mouse[0], mouse[1]);
                    break;
                case 4:
                    if(input.velConf){
                        input.active.revel(mouse[0], mouse[1]);
                    }
                default:
                    break;
            }
            //
            mX = mouse[0];
            mY = mouse[1];
        });
        //
        command.svg.on("mouseup", function(){
            console.log(input.moveState);
            if(input.moveState == 3){
                //command.updateVectors(input.active, 1);
                input.moveState = 0;
                input.velConf = true;
                command.update();
            }else{
                if(input.velConf && (mX - stX) == 0 && (mY - stY) == 0){
                    //command.updateVectors(input.active, command.vectorMode);
                    input.velConf = false;
                    command.update();
                }
                input.moveState = 0;
            }
        });
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
        });
    }
    //
    newArrow(arrow){
        var input = this;
        arrow.head.on("mousedown", function(){
            if(input.moveState == 0){
                if(!input.velConf){
                    input.active = arrow;
                    input.moveState = 4;
                }else if(arrow.obj == input.active){
                    input.moveState = 4;
                }
            }
        });
    }
}