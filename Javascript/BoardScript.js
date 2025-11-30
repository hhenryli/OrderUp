// @input showLogs = true;
// @input Component.ScriptComponent foodScript;

const SIK = require('SpectaclesInteractionKit.lspkg/SIK').SIK;
const interactionManager = SIK.InteractionManager;

// Grab references to both hands
const rightHand = SIK.HandInputData.getHand("right");

let thisPhysics;
var thisObject;
var foodObject;
let otherObject;
let otherTransform;
let oldScale;
let oldPosition;
let oldRotation;
let isParented = false; 

let COOK_DISTANCE_THRESHOLD = 30;
let pinchCount = 0;
let PINCHES_TO_CHOP = 3; // Number of pinches needed


function init() {
    thisObject = script.getSceneObject();
    // Create sync entity for this specific object
    syncEntity = new SyncEntity(script);
    syncEntity.notifyOnReady(onReady);
}

function onReady() {
    let tapEvent = script.createEvent("TapEvent");
    tapEvent.bind(onTouch);
    
    rightHand.onPinchDown.add(onPinched);
}

script.getFoodChild = function(object) {
    if (object.foodType.choppable == true) {
        print("object is choppable");
        foodObject = object;
    }
}

function onPinched() {
    if (foodObject != null) {
        pinchCount++;
        print("Grabbed - Pinch count: " + pinchCount);
        
        if (pinchCount >= PINCHES_TO_CHOP) {
            chopFood();
        }
    } else {
        print("No food object to chop");
    }
}

function onTouch(eventData) {
    if (foodObject != null) {
        pinchCount++;
    }
    print(pinchCount);
    if (pinchCount >= PINCHES_TO_CHOP) {
        chopFood();
    }
}


function chopFood() {
    print("Food is being cut! Releasing...");
    foodObject.markAsChopped(foodObject);
    foodObject = null;
    pinchCount = 0;
}


script.createEvent("OnStartEvent").bind(init);