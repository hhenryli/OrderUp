// @input Asset.ObjectPrefab thisPrefab
// @input SceneObject pan
// @input SceneObject board
// @input SceneObject plate

// @input Component.ScriptComponent panScript
// @input Component.ScriptComponent boardScript
// @input Component.ScriptComponent plateScript
// @input Component.ScriptComponent kitchenScript
// @input bool cookable
// @input bool choppable
// @input float snapDistance

// @input Component.RenderMeshVisual visual;
// @input Asset.RenderMesh[] meshOptions

// @input int foodName;
// @input SceneObject rootObjectSpawn;

const SIK = require('SpectaclesInteractionKit.lspkg/SIK').SIK;
const SceneObjectUtils = require('SpectaclesInteractionKit.lspkg/Utils/SceneObjectUtils');
const interactionManager = SIK.InteractionManager;

var sceneObject = script.getSceneObject();
var panObject;
var boardObject;
script.plateObject;
var physicsBody = sceneObject.getComponent("Physics.BodyComponent");
let syncEntity;
var transform = script.getTransform();
var originalScale = transform.getWorldScale();
let snapped = false;
let addedToPlateIndex = 0;
var meshProp;
var foodState; // 0: raw, 1: cooked, 2: chopped
let colorProp;
var spawnState;
var visual;

var colors = [
    new vec4(0.631,0.294,0.227,1), // chopped
];
function init() {
    script.sceneObject.foodType = {
        cookable: script.cookable,
        choppable: script.choppable,
    }
    switch (script.foodName) {
        case 0:
            script.sceneObject.foodName = global.FoodType.TOMATO;
            break;
        case 1:
            script.sceneObject.foodName = global.FoodType.LETTUCE;
            break;
        case 2:
            script.sceneObject.foodName = global.FoodType.BREAD;
            break;
        case 3:
            script.sceneObject.foodName = global.FoodType.MUSHROOM;
            break;
        case 4:
            script.sceneObject.foodName = global.FoodType.BACON;
            break;
        case 5:
            script.sceneObject.foodName = global.FoodType.BUN;
            break;
        case 6:
            script.sceneObject.foodName = global.FoodType.CHEESE;
            break;
        case 7:
            script.sceneObject.foodName = global.FoodType.PATTY;
            break;
        case 8:
            script.sceneObject.foodName = global.FoodType.RICE;
            break;
        case 9:
            script.sceneObject.foodName = global.FoodType.FISH;
            break;
        case 10:
            script.sceneObject.foodName = global.FoodType.SHRIMP;
            break;
        case 11:
            script.sceneObject.foodName = global.FoodType.DOUGH;
            break;
        case 12:
            script.sceneObject.foodName = global.FoodType.STEAK;
            break;
    }
    syncEntity = new SyncEntity(script);
    syncEntity.notifyOnReady(onReady);
}

function onReady() {
    meshProp = StorageProperty.manualInt("meshIndex", -1);
    colorProp = StorageProperty.manualInt("colorState", -1);
    foodState = StorageProperty.manualInt("foodState", 0);
    spawnState = StorageProperty.manualBool("spawnState", false);
    
    visual = sceneObject.getComponent("Component.RenderMeshVisual");

    if (visual && visual.mainMaterial) {
        visual.mainMaterial = visual.mainMaterial.clone();
        print("Cloned material for " + sceneObject.name);
    }
    
    // Mesh Prop
    syncEntity.addStorageProperty(meshProp);
    meshProp.onAnyChange.add(function(newValue, oldValue) {
        var idx = Math.floor(newValue);

        if (visual && script.meshOptions && idx >= 0 && idx < script.meshOptions.length) {
            visual.mesh = script.meshOptions[idx];
            print("Mesh applied index " + idx + " for " + sceneObject.name);
        } else {
            print("Skipping mesh assignment: invalid index " + idx);
        }
    });
    
    // Color Prop
    syncEntity.addStorageProperty(colorProp);
    colorProp.onAnyChange.add(function(newValue, oldValue) {
        var idx = Math.floor(newValue);
        if (visual && idx >= 0) {
            visual.mainPass.baseColor = colors[idx];
            print("mesh changed colors");
        }
    });
    
    // State Prop
    syncEntity.addStorageProperty(foodState);
    script.sceneObject.foodState = foodState;  // attach the actual StorageProperty
    
    // spawn prop
    syncEntity.addStorageProperty(spawnState);

    
    interactable = interactionManager.getInteractableBySceneObject(
        script.sceneObject
    );

    if (interactable) {
        interactable.onInteractorTriggerStart(onGrabbed);
        interactable.onInteractorTriggerEnd(onReleased);
    }
}

script.getPlateObject = function(object) {
    plateObject = object;
}

function trySnap() {
    if (snapped) return;
    interactable = interactionManager.getInteractableBySceneObject(sceneObject);
    
    var currentState = foodState.currentOrPendingValue;
    var foodPos = transform.getWorldPosition();
    var panPos = script.pan.getTransform().getWorldPosition();
    var boardPos = script.board.getTransform().getWorldPosition();
    var platePos;
    try {
        platePos = script.plate.getTransform().getWorldPosition();
        if (platePos) {
            plateObject = script.plate;
        }
    } catch {
        plateObject = SceneObjectUtils.findSceneObjectByName(script.rootObjectSpawn, "Plate");
        platePos = plateObject.getTransform().getWorldPosition();
    }

    var panDistance = foodPos.distance(panPos);
    var boardDistance = foodPos.distance(boardPos);
    var plateDistance = foodPos.distance(platePos);
    
    print(panDistance + "pan distance");
    print(boardDistance + "board distance");
    print(plateDistance + "plate distance");
    if (panDistance <= script.snapDistance && currentState != 1) {
                // Snap position and rotation
        transform.setWorldPosition(panPos);

        // Parent it
        if (script.pan) {
            sceneObject.setParent(script.pan);
            script.panScript.getFoodChild(sceneObject);
            transform.setWorldScale(originalScale);
            transform.setLocalPosition(new vec3(0, 0, 0.5));
        }
        snapped = true;
        interactable.enabled = false;
    } 
    else if (boardDistance <= script.snapDistance && currentState != 2) {
        transform.setWorldPosition(boardPos);
        // Parent it (so it moves with basket)
        if (script.board) {
            sceneObject.setParent(script.board);
            script.boardScript.getFoodChild(sceneObject);
            transform.setWorldScale(originalScale);
            transform.setLocalPosition(new vec3(0, 1, 0));
        }
        snapped = true;
        interactable.enabled = false;
    } else if (plateDistance <= script.snapDistance) {
        transform.setWorldPosition(platePos)
        
        sceneObject.setParent(plateObject);
        transform.setWorldScale(originalScale);
        transform.setLocalPosition(new vec3(0, 0, 0.5 + addedToPlateIndex++));
//        // Parent it (so it moves with basket)
//        try {
//            sceneObject.setParent(script.plate);
//            script.plateScript.getFoodChild(sceneObject);
//            transform.setWorldScale(originalScale);
//            transform.setLocalPosition(new vec3(0, 0, addedToPlateIndex++));
//            print("snapped to original plate");
//        } catch {
//            sceneObject.setParent(plateObject);
//            transform.setWorldScale(originalScale);
//            transform.setLocalPosition(new vec3(0, 0, addedToPlateIndex++));
//            print("snapped to new plate");
//        }
        snapped = true;
        interactable.enabled = false;
    }
};

script.sceneObject.markAsCooked = function(thisObject) {
    if (!syncEntity.doIOwnStore()) {
        syncEntity.requestOwnership(function onSuccess() {
            print("got owner for cooking");
            foodState.setPendingValue(1);
            colorProp.setPendingValue(0);
            releaseFoodFromPan();
        }, function onError() {
            print("did not get owner for cooking");
        });
    } else {
        print("Already own - cooking");
        foodState.setPendingValue(1);
        colorProp.setPendingValue(0);
        releaseFoodFromPan();
    }
}
script.sceneObject.markAsChopped = function(thisObject) {
    if (!syncEntity.doIOwnStore()) {
        print(syncEntity.doIOwnStore());
        syncEntity.requestOwnership(function onSuccess() {
            print("got owner");
            // Now safe to modify StorageProperties
            foodState.setPendingValue(2);
            meshProp.setPendingValue(0);
            releaseFoodFromBoard();
        }, function onError() {
            print("did not get owner");
        });
    } else {
        // Already owner, just modify
        foodState.setPendingValue(2);
        meshProp.setPendingValue(0);
        releaseFoodFromBoard();
    }
}

function releaseFoodFromPan() {
    sceneObject.setParent(null);
    transform.setWorldScale(originalScale);
    transform.setWorldPosition(script.pan.getTransform().getWorldPosition().add(new vec3(0, 1, 0)));
    interactable.enabled = true;
    snapped = false;
}

function releaseFoodFromBoard() {
    sceneObject.setParent(null);
    transform.setWorldScale(originalScale);
    transform.setWorldPosition(script.board.getTransform().getWorldPosition().add(new vec3(0, 1, 0)));
    interactable.enabled = true;
    snapped = false;
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
    let spawned = spawnState.currentOrPendingValue;
    if (!spawned) {
        script.kitchenScript.spawnFood(script.thisPrefab, transform.getWorldPosition());
        spawnState.setPendingValue(true);
    }
}

function onReleased(event) {
    if (sceneObject.foodType.cookable || sceneObject.foodType.choppable) {
        trySnap();
    }
    
    if (syncEntity.doIOwnStore()) {
        syncEntity.tryRevokeOwnership(function() {
            print("Ownership revoked on drop");
        });
    }
}

script.createEvent("OnStartEvent").bind(init);