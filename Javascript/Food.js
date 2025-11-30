// @input bool showLogs = true
// @input Component.ScriptComponent panScript;
// @input int foodType {"widget":"combobox", "values":[{"label":"Tomato", "value":"0"}, {"label":"Lettuce", "value":"1"}]}
// @input int foodState = 0

const SIK = require('SpectaclesInteractionKit.lspkg/SIK').SIK;
const interactionManager = SIK.InteractionManager;

// Grab references to both hands
const leftHand = SIK.HandInputData.getHand("left");
const rightHand = SIK.HandInputData.getHand("right");

// Array of colors to cycle through
const colors = [
    new vec4(1, 0, 0, 1),     // red
    new vec4(0, 1, 0, 1),     // green
    new vec4(0, 0, 1, 1),     // blue
    new vec4(1, 1, 0, 1),     // yellow
    new vec4(1, 0, 1, 1),     // magenta
    new vec4(0, 1, 1, 1),     // cyan
    new vec4(1, 0.5, 0, 1),   // orange
    new vec4(0.5, 0, 1, 1)    // purple
];

let currentColorIndex;
let objectTransform;
let syncEntity;
let isInitializing = true;
let colorProp;
let thisObject;
let physicsBody;
let panObject;
var cooked = false;
let newPos = new vec3(0, 0, 0);
let currentState = script.foodState;
let foodType = script.foodType;
let interactable;
let manipulation;
const transform = script.getTransform();

function init() {
    onSessionReady();
}

function onSessionReady() {
    thisObject = script.getSceneObject();
    
    script.sceneObject.foodState = {
        cooked: false,
        chopped: false,
        burnt: false,
        raw: true,
    };

    syncEntity = new SyncEntity(script);
    syncEntity.notifyOnReady(onReady);
    
    if (script.showLogs) {
        print("Color changer initialized for: " + thisObject.name + " with index: " + foodType);
    }
}

function onReady() {
    interactable = interactionManager.getInteractableBySceneObject(
    script.sceneObject
    );
    if (interactable) {
        interactable.onInteractorTriggerStart(onGrabbed);
        interactable.onInteractorTriggerEnd(onReleased);
    }
    // Set initial color
    setInitialColor();

    isInitializing = false; // NOW allow sync updates
    
    if (script.showLogs) {
        print(thisObject.name + " ready! Pinch near this object to change its color.");
    }
    
}

function onGrabbed(event) {
    print("grabbed");
    syncEntity.tryClaimOwnership(function(success) {
        if (success) {
            isGrabbed = true;
            print("✅ Claimed ownership");
            
            // Optional: Disable physics while grabbed
            let physicsBody = thisObject.getComponent("Physics.BodyComponent");
            if (physicsBody) {
                physicsBody.dynamic = false;
            }
        } else {
            print("❌ Failed to claim ownership");
        }
    });
}


function onReleased(event) {
    print("👋 Food released!");
    
    isGrabbed = false;
    
    // Re-enable physics
    let physicsBody = thisObject.getComponent("Physics.BodyComponent");
    if (physicsBody) {
        physicsBody.dynamic = true;
    }
}
script.getFoodType = function() {
    return foodType;
}

script.getFoodState = function() {
    return foodState;
}

script.getPhysics = function(newObject) {
    physicsBody = newObject.getComponent("Physics.BodyComponent");
    physicsBody.onCollisionEnter.add(onCollisionEnter);
}

global.isCooked = function() {
    return global.cooked;
}

function setInitialColor() {
    const meshVisual = thisObject.getComponent("Component.RenderMeshVisual");
    
    var color;
    // Set instance-specific color index based on food type
    switch(foodType) {
        case global.FoodType.TOMATO:
            color = colors[0];
            break;
        case global.FoodType.LETTUCE:
            color = colors[1];
            break;
    }
    
    if (meshVisual) {
        meshVisual.mainPass.baseColor = color;
        if (script.showLogs) {
            print(thisObject.name + " set to color index: " + color);
        }
    }
}

function onColorChange(newVal) {
    script.colorIndex = newVal;
    updateObjectColor();
}

function updateObjectColor() {
    // Get the MeshVisual component on this object
    const meshVisual = thisObject.getComponent("Component.RenderMeshVisual");
    if (meshVisual) {
        meshVisual.mainPass.baseColor = colors[script.colorIndex];
        if (script.showLogs) {
            print(thisObject.name + " color changed to index: " + script.colorIndex);
        }
    }
}


script.sceneObject.markAsCooked = function(thisObject) {
    script.sceneObject.foodState = {
        cooked: true,
        burnt: false,
        raw: false,
    }
    print("Food marked as cooked");
    
    const meshVisual = thisObject.getComponent("Component.RenderMeshVisual");
    print(meshVisual);
    if (meshVisual) {
        meshVisual.mainPass.baseColor = colors[4];
        if (script.showLogs) {
            print(thisObject.name + " color changed to cooked");
        }
    }
}

function onCollisionEnter(e) {
    let collision = e.collision;
    let otherObject = collision.collider.getSceneObject();
}


function snapToParent(otherObject) {
    let thisTransform = thisObject.getTransform();
    print("Current position: " + thisTransform.getWorldPosition().toString());
    
    physicsBody.dynamic = false;
    
    thisTransform.setWorldPosition(newPos); // Make it 50 units up so you can see it
}
script.createEvent("OnStartEvent").bind(init);
