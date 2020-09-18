class GameController{
    constructor(){
        $('#gameReadyButton').html(`
            <b>Waiting for player to start</b>
        `);
        $('#gameMenu').show();
        $('#gameControls').hide();
        $('#gameCanvasContainer').hide();
        $('#gameEndScreen').hide();
    }

    handleMess(mess){
        if(mess.data.updateGameState != undefined){
            this.switchScreen(mess.data.updateGameState);
        }
    }

    switchScreen(s) {
        this.screen = s;
        switch (s) {
            case 0:
                $('#gameMenu').show();
                $('#gameControls').hide();
                $('#gameEndScreen').hide();
                break;
            case 1:
                $('#gameMenu').hide();
                $('#gameControls').show();
                $('#gameEndScreen').hide();
                this.startGame();
                break;
            case 2:
                $('#gameEndScreen').html(`
                    <b>Game Over</b>
                `);
                $('#gameMenu').hide();
                $('#gameControls').hide();
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
    }

}