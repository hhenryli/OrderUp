// @input bool showLogs = true
// @input SceneObject submissionSpot
// @input Component.ScriptComponent submissionScript
// @input float snapDistance
// @input Component.ScriptComponent foodScript;
var plateObject;
var foodObject;
let physicsBody;
var transform = script.getTransform();
var originalScale = transform.getWorldScale();

const SIK = require('SpectaclesInteractionKit.lspkg/SIK').SIK;
const interactionManager = SIK.InteractionManager;

function init() {
    plateObject = script.getSceneObject();

    syncEntity = new SyncEntity(script);
    syncEntity.notifyOnReady(onReady);
    if (script.showLogs) {
        print("Plate initialized");
    }
}

function onReady() {
    let interactable = interactionManager.getInteractableBySceneObject(
        script.sceneObject
    );

    if (interactable) {
        interactable.onInteractorTriggerStart(onGrabbed);
        interactable.onInteractorTriggerEnd(onReleased);
    }
}

script.getFoodChild = function(object) {
    if (object.foodType.cookable == true) {
        print("object is cookable");
        foodObject = object;
    }
}


function onGrabbed(event) {
    if (!syncEntity.doIOwnStore()) {
        syncEntity.requestOwnership(function onSuccess() {
            print("Successfully claimed ownership on grab");
        }, function onError() {
            print("Failed to claim ownership on grab");
        });
    } else {
        print("Already own this food");
    }
}

function onReleased(event) {
    trySnap();
    
    if (syncEntity.doIOwnStore()) {
        syncEntity.tryRevokeOwnership(function() {
            print("Ownership revoked on drop");
        });
    }
}

function trySnap() {
    print("plate snap");
    var submissionSpot = script.submissionSpot;
    var submitPos = submissionSpot.getTransform().getWorldPosition();
    var platePos = transform.getWorldPosition()
    var distance = platePos.distance(submitPos);
    
    if (distance < script.snapDistance) {
        transform.setWorldPosition(submitPos);
        
        if (script.submissionSpot) {
            script.submissionScript.getPlate(plateObject);
        }
    }
}

script.getPhysics = function(newObject) {
    physicsBody = newObject.getComponent("Physics.BodyComponent");
    physicsBody.onCollisionEnter.add(onCollisionEnter);
}

function snapFoodToPlate(foodObject) {
    let foodTransform = foodObject.getTransform();
    let oldScale = foodTransform.getWorldScale();
    
    foodObject.setParent(thisObject);
    
    // Position on top of plate
    foodTransform.setWorldScale(new vec3(10, 10, 10));
    foodTransform.setLocalPosition(new vec3(0, 1, 0));
    
    print("Food added to plate!");
}

script.createEvent("OnStartEvent").bind(init);