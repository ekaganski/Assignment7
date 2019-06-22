//1.setting namespace & initilizing start values
var Monopoly = {};
Monopoly.allowRoll = true;
Monopoly.moneyAtStart = 200;
Monopoly.doubleCounter = 0;
//2. Initilizing init functions
Monopoly.init = function(){
    $(document).ready(function(){
        Monopoly.adjustBoardSize();
        $(window).bind("resize",Monopoly.adjustBoardSize);
        Monopoly.initDice();
        Monopoly.initPopups();
        Monopoly.start();        
    });
};
//start function
Monopoly.start = function(){
    Monopoly.showPopup("intro")
};

//init dice roll
Monopoly.initDice = function(){
    $(".dice").click(function(){
        if (Monopoly.allowRoll){
            Monopoly.rollDice();
        }
    });
};

//determine current player
Monopoly.getCurrentPlayer = function(){
    return $(".player.current-turn");
};
//determine current cell
Monopoly.getPlayersCell = function(player){
    return player.closest(".cell");
};

//determine playersmoney
Monopoly.getPlayersMoney = function(player){
    return parseInt(player.attr("data-money"));
};
//Update Playersmoney
Monopoly.updatePlayersMoney = function(player,amount){
    var playersMoney = parseInt(player.attr("data-money"));
    playersMoney -= amount;
    $(".input_money_player").text("playersMoney: "+ player.attr("id") +" has "+playersMoney);
    
   
    if (playersMoney < 0 ){
        var popup = Monopoly.getPopup("broke");
        popup.find("button").unbind("click").bind("click",function(){
            var clickedBtn = $(this);
            if (clickedBtn.is("#yes")){
                Monopoly.handleBuy(player,propertyCell,propertyCost);
            }else{
                Monopoly.closeAndNextTurn();
            }
        });
        Monopoly.sendToGo = function(player){
            player.addClass("broke");
            $(".corner.game.cell.go").append(player);
            Monopoly.setNextPlayerTurn();
            Monopoly.closePopup();
        };
    }
    player.attr("data-money",playersMoney);
    player.attr("title",player.attr("id") + ": $" + playersMoney);
    Monopoly.playSound("chaching");
};

//roll both dices
Monopoly.rollDice = function(){
    var result1 = Math.floor(Math.random() * 6) + 1 ;
    var result2 = Math.floor(Math.random() * 6) + 1 ;
    $(".dice").find(".dice-dot").css("opacity",0);
    $(".dice#dice1").attr("data-num",result1).find(".dice-dot.num" + result1).css("opacity",1);
    $(".dice#dice2").attr("data-num",result2).find(".dice-dot.num" + result2).css("opacity",1);
    if(result1 === result2){
        Monopoly.doubleCounter++;
        if(Monopoly.doubleCounter==1){
            Monopoly.rollDice();
        }
    }
   
    var currentPlayer = Monopoly.getCurrentPlayer();
    Monopoly.handleAction(currentPlayer,"move",result1 + result2);
};

//move player
Monopoly.movePlayer = function(player,steps){
    player.removeClass("sad-face");
    player.removeClass("smile-face");


    Monopoly.allowRoll = false;
    var playerMovementInterval = setInterval(function(){
        if (steps == 0) {
            clearInterval(playerMovementInterval);
            Monopoly.handleTurn(player);
        }else{
            var playerCell = Monopoly.getPlayersCell(player);
            var nextCell = Monopoly.getNextCell(playerCell);
            nextCell.find(".content").append(player);
            steps--;
        }
    },200);
};

//handle turn
Monopoly.handleTurn = function () {
    var player = Monopoly.getCurrentPlayer();
    var playerCell = Monopoly.getPlayersCell(player);
    if (playerCell.is(".available.property")) {
        Monopoly.handleBuyProperty(player, playerCell);
    } else if (playerCell.is(".property:not(.available)") && !playerCell.hasClass(player.attr("id"))) {
        Monopoly.handlePayRent(player, playerCell);
        player.removeClass("smile-face");
    } else if (playerCell.is(".property:not(.available)") && playerCell.hasClass(player.attr("id"))) {
        Monopoly.handlePayRent(player, playerCell);
        player.addClass("smile-face");
    } else if (playerCell.is(".go-to-jail")) {
        Monopoly.handleGoToJail(player);
        player.removeClass("smile-face");
    } else if (playerCell.is(".chance")) {
        Monopoly.handleChanceCard(player);
        player.removeClass("smile-face");
    } else if (playerCell.is(".community")) {
        Monopoly.handleCommunityCard(player);
        player.removeClass("smile-face");

    } else {
        Monopoly.setNextPlayerTurn();
    }
}
//set nextplayer turn
Monopoly.setNextPlayerTurn = function(){
    var currentPlayerTurn = Monopoly.getCurrentPlayer();
    var playerId = parseInt(currentPlayerTurn.attr("id").replace("player",""));
    var nextPlayerId = playerId + 1;
    if (nextPlayerId > $(".player").length){
        nextPlayerId = 1;
    }
    currentPlayerTurn.removeClass("current-turn");
    var nextPlayer = $(".player#player" + nextPlayerId);
    nextPlayer.addClass("current-turn");
    if (nextPlayer.is(".jailed")){
        var currentJailTime = parseInt(nextPlayer.attr("data-jail-time"));
        currentJailTime++;
        nextPlayer.attr("data-jail-time",currentJailTime);
        if (currentJailTime > 3){
            nextPlayer.removeClass("jailed");
            nextPlayer.removeAttr("data-jail-time");
        }
        Monopoly.setNextPlayerTurn();
        return;
    }
    Monopoly.closePopup();
    Monopoly.allowRoll = true;
};

//buy property
Monopoly.handleBuyProperty = function(player,propertyCell){
    var propertyCost = Monopoly.calculateProperyCost(propertyCell);
    var popup = Monopoly.getPopup("buy");
    popup.find(".cell-price").text(propertyCost);
    popup.find("button").unbind("click").bind("click",function(){
        var clickedBtn = $(this);
        if (clickedBtn.is("#yes")){
            Monopoly.handleBuy(player,propertyCell,propertyCost);
        }else{
            Monopoly.closeAndNextTurn();
        }
    });
    Monopoly.showPopup("buy");
};
//handle payRent
Monopoly.handlePayRent = function(player,propertyCell){
    var popup = Monopoly.getPopup("pay");
    var currentRent = parseInt(propertyCell.attr("data-rent"));
    var properyOwnerId = propertyCell.attr("data-owner");
    //if((properyOwnerId)==)
    popup.find("#player-placeholder").text(properyOwnerId);
    popup.find("#amount-placeholder").text(currentRent);
    popup.find("button").unbind("click").bind("click",function(){
        var properyOwner = $(".player#"+ properyOwnerId);
        Monopoly.updatePlayersMoney(player,currentRent);
        Monopoly.updatePlayersMoney(properyOwner,-1*currentRent);
        Monopoly.closeAndNextTurn();
    });
   Monopoly.showPopup("pay");
};

//handle jail function
Monopoly.handleGoToJail = function(player){
    var popup = Monopoly.getPopup("jail");
    player.addClass("sad-face");//sad face add when in jail
    popup.find("button").unbind("click").bind("click",function(){
        Monopoly.handleAction(player,"jail");
    });
    Monopoly.showPopup("jail");
};

//get chance card
Monopoly.handleChanceCard = function(player){
    var popup = Monopoly.getPopup("chance");
    popup.find(".popup-content").addClass("loading-state");
    $.get("https://itcmonopoly.appspot.com/get_random_chance_card", function(chanceJson){
        popup.find(".popup-content #text-placeholder").text(chanceJson["content"]);
        popup.find(".popup-title").text(chanceJson["title"]);
        popup.find(".popup-content").removeClass("loading-state");
        popup.find(".popup-content button").attr("data-action",chanceJson["action"]).attr("data-amount",chanceJson["amount"]);
    },"json");
    popup.find("button").unbind("click").bind("click",function(){
        var currentBtn = $(this);
        var action = currentBtn.attr("data-action");
        var amount = currentBtn.attr("data-amount");
        Monopoly.handleAction(player,action,amount);
    });
    Monopoly.showPopup("chance");
};
//get community card
Monopoly.handleCommunityCard = function(player){
    var popup = Monopoly.getPopup("community");
    popup.find(".popup-content").addClass("loading-state");
    $.get("https://itcmonopoly.appspot.com/get_random_community_card", function(chanceJson){
        popup.find(".popup-content #text-placeholder").text(chanceJson["content"]);
        popup.find(".popup-title").text(chanceJson["title"]);
        popup.find(".popup-content").removeClass("loading-state");
        popup.find(".popup-content button").attr("data-action",chanceJson["action"]).attr("data-amount",chanceJson["amount"]);
    },"json");
    popup.find("button").unbind("click").bind("click",function(){
        var currentBtn = $(this);
        var action = currentBtn.attr("data-action");
        var amount = currentBtn.attr("data-amount");
        Monopoly.handleAction(player,action,amount);
    });
    //alert("not implemented yet!")
    Monopoly.showPopup("community");
    Monopoly.setNextPlayerTurn();
};

//send to jail
Monopoly.sendToJail = function(player){
    player.addClass("jailed");
    player.attr("data-jail-time",1);
    $(".corner.game.cell.in-jail").append(player);
    Monopoly.playSound("woopwoop");
    Monopoly.setNextPlayerTurn();
    Monopoly.closePopup();
};



//handle popup
Monopoly.getPopup = function(popupId){
    return $(".popup-lightbox .popup-page#" + popupId);
};
//calculate cost of cell
Monopoly.calculateProperyCost = function(propertyCell){
    var cellGroup = propertyCell.attr("data-group");
    var cellPrice = parseInt(cellGroup.replace("group","")) * 5;
    if (cellGroup == "rail"){
        cellPrice = 10;
    }
    return cellPrice;
};

// calculate rent of cell
Monopoly.calculateProperyRent = function(propertyCost){
    return propertyCost/2;
};

//handover to next player
Monopoly.closeAndNextTurn = function(){
    Monopoly.setNextPlayerTurn();
    Monopoly.closePopup();
};
//initializing popups
Monopoly.initPopups = function(){
    $(".popup-page#intro").find("button").click(function(){
        var numOfPlayers = $(this).closest(".popup-page").find("input").val();
        if (Monopoly.isValidInput("numofplayers",numOfPlayers)){
            Monopoly.createPlayers(numOfPlayers);
            Monopoly.closePopup();
        }
    });
};

//handle property buy
Monopoly.handleBuy = function(player,propertyCell,propertyCost){
    var playersMoney = Monopoly.getPlayersMoney(player)
    player.addClass("smile-face");
    if (playersMoney < propertyCost){
        Monopoly.showErrorMsg();
        Monopoly.playSound("broke");
    }else{
        Monopoly.updatePlayersMoney(player,propertyCost);
        var rent = Monopoly.calculateProperyRent(propertyCost);

        propertyCell.removeClass("available")
                    .addClass(player.attr("id"))
                    .attr("data-owner",player.attr("id"))
                    .attr("data-rent",rent);
        Monopoly.setNextPlayerTurn();
    }
};




//handle player actions
Monopoly.handleAction = function(player,action,amount){
    //console.log(action)
    switch(action){
        case "move":
       	    //console.log(amount)
            Monopoly.movePlayer(player,amount);
             break;
        case "pay":
            Monopoly.updatePlayersMoney(player,amount);
            Monopoly.setNextPlayerTurn();
            break;
        case "jail":
            Monopoly.sendToJail(player);
            break;
    };
    Monopoly.closePopup();
};




//create or initializing players
Monopoly.createPlayers = function(numOfPlayers){
    var startCell = $(".go");
    for (var i=1; i<= numOfPlayers; i++){
        var player = $("<div />").addClass("player shadowed").attr("id","player" + i).attr("title","player" + i + ": $" + Monopoly.moneyAtStart);
        startCell.find(".content").append(player);
        if (i==1){
            player.addClass("current-turn");
        }
        player.attr("data-money",Monopoly.moneyAtStart);
    }
};

//next cell get
Monopoly.getNextCell = function(cell){
    var currentCellId = parseInt(cell.attr("id").replace("cell",""));
    var nextCellId = currentCellId + 1
    if (nextCellId > 40){
        Monopoly.handlePassedGo();
        nextCellId = 1;
    }
    return $(".cell#cell" + nextCellId);
};

//handle new passing of go
Monopoly.handlePassedGo = function(){
    var player = Monopoly.getCurrentPlayer();
    Monopoly.updatePlayersMoney(player,(-Monopoly.moneyAtStart/10));
  
};

//check if num of players is valid
Monopoly.isValidInput = function(validate,value){
    var isValid = false;
    switch(validate){
        case "numofplayers":
            if(value > 1 && value <= 6){
                isValid = true;
            }
            //TODO: remove when done
            //console.log("the val " + value)
            break;
    }

    if (!isValid){
        Monopoly.showErrorMsg();
    }
    return isValid;

}
//handle popup for errors
Monopoly.showErrorMsg = function(){
    $(".popup-page .invalid-error").fadeTo(1000,1);
    setTimeout(function(){
            $(".popup-page .invalid-error").fadeTo(1000,0);
    },2000);
};

//adjust board size
Monopoly.adjustBoardSize = function(){
    var gameBoard = $(".board");
    var boardSize = Math.min($(window).height(),$(window).width());
    boardSize -= parseInt(gameBoard.css("margin-top")) *2;
    $(".board").css({"height":boardSize,"width":boardSize});
}
//close popup
Monopoly.closePopup = function(){
    $(".popup-lightbox").fadeOut();
};
//handle sound play
Monopoly.playSound = function(sound){
    var snd = new Audio("./sounds/" + sound + ".wav"); 
    snd.play();
}
//show popip
Monopoly.showPopup = function(popupId){
    $(".popup-lightbox .popup-page").hide();
    $(".popup-lightbox .popup-page#" + popupId).show();
    $(".popup-lightbox").fadeIn();
};
//call init function
Monopoly.init();