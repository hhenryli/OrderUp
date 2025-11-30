// @input Component.Text timerText;
// @input float gameDuration = 180.0;
// @input SceneObject startButton;
// @input SceneObject endMenu;
// @input Component.Text scoreText;
// @input Component.Text countText;
// @input Component.ScriptComponent submissionScript
let syncEntity;
let gameStarted = false;
let gameEnded = false;
let startTime = 0;
let lastUpdateTime = 0;

var startProp;
var timerProp;

let SIK;
let interactionManager;

let isHost = false;
let interactable;

function init() {
    SIK = require('SpectaclesInteractionKit.lspkg/SIK').SIK;
    interactionManager = SIK.InteractionManager;

    interactable = interactionManager.getInteractableBySceneObject(script.startButton);
    if (interactable) {
        interactable.onTriggerStart.add(onPressed);
        print("Button ready");
    } else {
        print("ERROR: No interactable on button");
    }

    // THEN disable it so it’s hidden until multiplayer starts
    script.startButton.enabled = false;
    
    syncEntity = new SyncEntity(script, null, true);
    
    startProp = StorageProperty.manualInt("started", 0);
    syncEntity.notifyOnReady(onReady);

    syncEntity.onSetupFinished.add(() => {
        isHost = syncEntity.doIOwnStore();
        print("Is host: " + isHost);
    });

    let updateEvent = script.createEvent("UpdateEvent");
    updateEvent.bind(onUpdate);
}

function onReady() {
    script.startButton.enabled = true;
    // Use Int instead of Bool to avoid null issues
    timerProp = StorageProperty.manualInt("time", Math.floor(script.gameDuration));
    
    startProp.onAnyChange.add(function(newValue) {
        print("Start value changed to: " + newValue);
        
        // Only start when value is 1
        if (newValue === 1 && !gameStarted) {
            print("Starting game!");
            gameStarted = true;
            startTime = getTime();
            script.startButton.enabled = false;
        }
        
        if (newValue === 0 && gameEnded) {
            print("Ending game!");
            script.endMenu.enabled = true;
            script.scoreText.text = script.submissionScript.getScore().toString();
            script.countText.text = "Recipes Made: " + script.submissionScript.getSubmissionCount().toString();
        }
    });
    syncEntity.addStorageProperty(startProp);

    syncEntity.addStorageProperty(timerProp);

    timerProp.onAnyChange.add(function(newValue) {
        let minutes = Math.floor(newValue / 60);
        let seconds = newValue % 60;
        let timeString = minutes + ":" + (seconds < 10 ? "0" : "") + seconds;
        
        if (script.timerText) {
            script.timerText.text = timeString;
        }
    });
   
}

function onPressed() {
    print("Button pressed!");
    
    if (!isHost) {
        print("Only host can start");
        return;
    }

    let currentValue = startProp.currentOrPendingValue || 0;
    if (currentValue === 1) {
        print("Already started");
        return;
    }

    print("Setting start to 1");
    startProp.setPendingValue(1);
}

function onUpdate() {
    if (!gameStarted || gameEnded) {
        return;
    }

    let currentTime = getTime();
    
    // Only update once per second
    if (currentTime - lastUpdateTime < 1.0) {
        return;
    }
    
    lastUpdateTime = currentTime;

    let elapsedTime = currentTime - startTime;
    let remainingTime = Math.floor(script.gameDuration - elapsedTime);

    if (remainingTime <= 0) {
        remainingTime = 0;
        endGame();
        return;
    }

    // Only host updates the timer
    if (isHost) {
        timerProp.setPendingValue(remainingTime);
    }
}

function endGame() {
    if (gameEnded) return;

    print("=== GAME ENDED ===");
    gameEnded = true;

    if (script.timerText) {
        script.timerText.text = "TIME'S UP!";
    }
    script.endMenu.enabled = true;
    script.scoreText.text = script.submissionScript.getScore().toString();
    script.countText.text = "Recipes Made: " + script.submissionScript.getSubmissionCount().toString();
    startProp.setPendingValue(0);
}

script.isGameActive = function() {
    return gameStarted && !gameEnded;
}

script.createEvent("OnStartEvent").bind(init);