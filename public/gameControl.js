class GameController{
    constructor(){
        this.score = 0;
        $('#gameReadyButton').html(`
            <b>Waiting for player to start</b>
        `);
        $('#gameMenu').show();
        $('#gameControlsContainer').hide();
        $('#gameCanvasContainer').hide();
        $('#gameEndScreen').hide();
    }

    handleMess(mess){
        if (mess.data.score != undefined) {
            this.score = mess.data.score
            $('#gameControllerScoreBoard').html(`
                <b>${this.score}</b>
            `);
        }
        if(mess.data.updateGameState != undefined){
            this.switchScreen(mess.data.updateGameState);
        }
    }

    switchScreen(s) {
        this.screen = s;
        switch (s) {
            case 0:
                $('#gameMenu').show();
                $('#gameControlsContainer').hide();
                $('#gameEndScreen').hide();
                break;
            case 1:
                $('#gameMenu').hide();
                $('#gameControlsContainer').show();
                $('#gameEndScreen').hide();
                this.startGame();
                break;
            case 2:
                $('#gameEndScreen').html(`
                    <b>Game Over <br>Score: ${this.score}</b>
                `);
                $('#gameMenu').hide();
                $('#gameControlsContainer').hide();
                $('#gameEndScreen').show();
                break;
        }
    }

    startGame(){
        $('.MovementButtons').click(function () {
            let key = $(this).attr("key");
            let data = JSON.stringify({
                purp: "pass",
                data: { key: key },
                time: Date.now(),
                id: conHandler.id
            });

            conHandler.socket.send(data);
        });

        $(document).keydown(function(event){
            let data = {
                purp: "pass",
                data: {},
                time: Date.now(),
                id: conHandler.id
            };

            if(event.key == "ArrowUp"){
                data.data.key = 0;
            }else if(event.key == "ArrowLeft"){
                data.data.key = 1;
            }else if(event.key == "ArrowRight"){
                data.data.key = 2;
            }else if(event.key == "ArrowDown"){
                data.data.key = 3;
            }else{
                return;
            }

            conHandler.socket.send(JSON.stringify(data));
        });
    }

}