// @input showLogs = true;
// @input Component.ScriptComponent foodScript;

const SIK = require('SpectaclesInteractionKit.lspkg/SIK').SIK;
const interactionManager = SIK.InteractionManager;

// Grab references to both hands
const rightHand = SIK.HandInputData.getHand("right");

let thisPhysics;
let foodObject;
let otherObject;
let otherTransform;
let oldScale;
let oldPosition;
let oldRotation;
let isParented = false; 

let COOK_DISTANCE_THRESHOLD = 30;
let pinchCount = 0;
let PINCHES_TO_COOK = 4; // Number of pinches needed


function init() {
    script.thisObject = script.getSceneObject();
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
    if (object.foodType.cookable == true) {
        print("object is cookable");
        foodObject = object;
    }
}

function onPinched(eventData) {
    print(foodObject);
    if (foodObject != null) {
        pinchCount++;
    }
    print(pinchCount);
    if (pinchCount >= PINCHES_TO_COOK) {
        cookFood();
    }
}

function onTouch(eventData) {
    if (foodObject != null) {
        pinchCount++;
    }
    print(pinchCount);
    if (pinchCount >= PINCHES_TO_COOK) {
        cookFood();
    }
}

function onPinchDetected() {
    print("pinch detected");
//    let panPos = script.thisObject.getTransform().getWorldPosition();
//    
//    let rightHandPos = rightHand.indexTip.position;
//    let rightDist = rightHandPos.distance(panPos);
//    print(rightDist);
//    if (rightDist < COOK_DISTANCE_THRESHOLD) {
//        pinchCount++;
//        print("Pinch " + pinchCount + " of " + PINCHES_TO_COOK);
//        
//        if (pinchCount >= PINCHES_TO_COOK) {
//            cookFood();
//        }
//    }
}

function cookFood() {
    print("Food is cooked! Releasing...");
    foodObject.markAsCooked(foodObject);
    foodObject = null;
    pinchCount = 0;
}

//function onCollisionEnter(e) {
//    let collision = e.collision;
//    otherObject = collision.collider.getSceneObject();
//    
//    pinchCount = 0; // Reset counter
//    if (otherObject.name == "OPrefab" && !isParented && !otherObject.foodState.cooked) {
//        foodObject = otherObject;
//        snapToParent(otherObject);
//    }
//}
//
//function snapToParent(otherObject) {
//    isParented = true;
//
//    otherTransform = otherObject.getTransform();
//    oldScale = otherTransform.getWorldScale();
//    oldPosition = otherTransform.getWorldPosition();
//    oldRotation = otherTransform.getWorldRotation();
//    otherObject.setParent(thisObject);
//    print(otherObject.getParent());
//    var parentScale = thisObject.getTransform().getWorldScale();
//    var newLocalScale = new vec3(
//        oldScale.x / parentScale.x,
//        oldScale.y / parentScale.y,
//        oldScale.z / parentScale.z
//    );
//    otherTransform.setWorldScale(new vec3(10, 10, 10));
//    otherTransform.setLocalPosition(new vec3(0, 1, 0));
//}
//
//function releaseFromParent() {
//    foodObject.setParent(null);
//    foodTransform = foodObject.getTransform();
//    foodTransform.setWorldScale(oldScale);
//    foodTransform.setWorldPosition(oldPosition.add(new vec3(0, 3, 0)));
////    otherTransform.setWorldRotation(oldRotation);
//    
//    foodObject = null;
//    isParented = false;
//}
//
script.createEvent("OnStartEvent").bind(init);