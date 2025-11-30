// @input Component.ScriptComponent foodInstantiator;
// @input Component.ScriptComponent objectInstantiator;
// @input Asset.ObjectPrefab[] foodPrefabs;
// @input Asset.ObjectPrefab panPrefab;
// @input Asset.ObjectPrefab boardPrefab;
// @input Asset.ObjectPrefab platePrefab;
// @input bool showLogs
// @input Component.ScriptComponent foodScript;
// @input Component.ScriptComponent panScript;
// @input SceneObject rootFoodSpawn;

const foodInstantiator = script.foodInstantiator;
const objectInstantiator = script.objectInstantiator;
const tomatoPrefab = script.tomatoPrefab;
const lettucePrefab = script.lettucePrefab;
const panPrefab = script.panPrefab;
const showLogs = script.showLogs;

var foodObjects = [];

let states = ["raw", "chopped", "cooked", "burned"];
let ingredientIndex = 0;

let syncEntity;
let stateProp;
let newObject;
var foodObject = null;
var plateObject;
var panObject;
var boardObject;
let objectBody;
let spawnFlagProp;
var rootFoodSpawnPos = script.rootFoodSpawn.getTransform().getWorldPosition();

var spawnedCount = 0;
var ingredientCount = script.foodPrefabs.length;

function init() {
    // Create new sync entity for this script
    syncEntity = new SyncEntity(script, null, true);
    spawnFlagProp = syncEntity.addStorageProperty(StorageProperty.manualInt("spawnFlag", 0));
    syncEntity.addStorageProperty(spawnFlagProp);
    syncEntity.notifyOnReady(onReady); 

    if (showLogs) {
        print("Ingredient initialized with state: " + states[ingredientIndex]); 
    }
}

function onIngredientChange(newVal) {
    ingredientIndex = newVal;
}

function onReady() {
    let currentOwner = syncEntity.ownerInfo;
    if (spawnFlagProp.currentOrPendingValue == 0) {
        spawnFoodGrid();
        spawnFlagProp.setPendingValue(1);
    }
}

function spawnFoodGrid() {
    const spacing = 7;
    const cols = 4; // Fixed number of columns
    const rows = Math.ceil(ingredientCount / cols);
    
    for (let i = 0; i < ingredientCount; i++) {
        const col = i % cols;
        const row = Math.floor(i / cols);
        
        const pos = rootFoodSpawnPos.add(new vec3(
            0,
            col * spacing,
            row * spacing
        ));
        
        script.spawnFood(script.foodPrefabs[i], pos);
    }
}
script.spawnFood = function(prefab, worldPosition) {
    if (showLogs) {
        print("Spawning food: " + prefab.name);
    }

    if (foodInstantiator.isReady()) {
        const options = new InstantiationOptions();
        options.worldPosition = worldPosition;
        foodInstantiator.instantiate(prefab, options, function (networkRootInfo) {
            foodObject = networkRootInfo.instantiatedObject; 
            script.addFoodToArray(foodObject);
        });
    }
}

script.spawnObject = function(prefab, worldPosition) {
    if (showLogs) {
        print("Spawning object: " + prefab.name);
    }
    if (objectInstantiator.isReady()) {
        const options = new InstantiationOptions();
        options.worldScale = new vec3(1, 1, 1);
        options.worldPosition = worldPosition;
        objectInstantiator.instantiate(prefab, options, function (networkRootInfo) {
            newObject = networkRootInfo.instantiatedObject;
                        
            if (!newObject) {
                print("Error: newObject is null!");
                return;
            }
            
            print("Updating " + foodObjects.length + " food objects with plate reference");
           
            for (let i = 0; i < foodObjects.length; i++) {
                if (foodObjects[i]) {
                    try {
                        foodObjects[i].plateObject = newObject;
                        print("Set plate reference for: " + foodObjects[i].name);
                    } catch (e) {
                        print("Error setting plate for index " + i + ": " + e);
                    }
                }
            }
        });
    }
}

script.addFoodToArray = function(food) {
    foodObjects.push(food);
}

script.removeFoodFromArray = function(food) {
    const index = foodObjects.indexOf(food);
    if (index > -1) {
        foodObjects.splice(index, 1);
        print("Removed food object from array. Remaining: " + foodObjects.length);
    }
}

// Initialize
script.createEvent("OnStartEvent").bind(init);
