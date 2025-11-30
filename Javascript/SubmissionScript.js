// @input bool showLogs = true
// @input Component.Text scoreText // Optional: display score
// @input SceneObject plateObject
// @input Component.Text recipeText;
// @input Component.Text ingredientText;
// @input Component.ScriptComponent kitchenManager;
// @input Asset.ObjectPrefab platePrefab;
// @input SceneObject originalPlate;

const SIK = require('SpectaclesInteractionKit.lspkg/SIK').SIK;
const interactionManager = SIK.InteractionManager;
const interactionConfiguration = SIK.InteractionConfiguration;

let thisObject;
let physicsBody;
var scoreProp;
var recipeProp;
let syncEntity;
let activeRecipe = null;
var submissionCount;
var originalPlatePos = script.originalPlate.getTransform().getWorldPosition();

// Define valid recipes
const RECIPES = {
    "Tomato": {
        ingredients: [global.FoodType.TOMATO],
        requiredStates: [0],
        points: 10
    },
    "Salad": {
        ingredients: [global.FoodType.LETTUCE, global.FoodType.TOMATO],
        requiredStates: [2, 2],
        points: 50
    },
    "Grilled Mushroom": {
        ingredients: [global.FoodType.MUSHROOM],
        requiredStates: [1],
        points: 20
    },
    "BLT": {
        ingredients: [global.FoodType.BREAD, global.FoodType.BACON, global.FoodType.LETTUCE, global.FoodType.TOMATO],
        requiredStates: [2, 1, 2, 2],
        points: 70
    },
    "Hamburger": {
        ingredients: [global.FoodType.BUN, global.FoodType.PATTY, global.FoodType.LETTUCE, global.FoodType.TOMATO],
        requiredStates: [0, 1, 2, 2],
        points: 85
    },
    "Cheeseburger": {
        ingredients: [global.FoodType.BUN, global.FoodType.PATTY, global.FoodType.LETTUCE, global.FoodType.TOMATO, global.FoodType.CHEESE],
        requiredStates: [0, 1, 2, 2, 2],
        points: 100
    },
    "Nigiri": {
        ingredients: [global.FoodType.RICE, global.FoodType.FISH],
        requiredStates: [0, 2],
        points: 40
    },
    "Pizza": {
        ingredients: [global.FoodType.DOUGH, global.FoodType.TOMATO, global.FoodType.CHEESE],
        requiredStates: [1, 1, 2],
        points: 60
    },
    "Steak": {
        ingredients: [global.FoodType.STEAK, global.FoodType.MUSHROOM, global.FoodType.LETTUCE],
        requiredStates: [1, 1, 2],
        points: 60
    },
    "Toast": {
        ingredients: [global.FoodType.BREAD],
        requiredStates: [1],
        points: 30
    },
    "Grilled Cheese": {
        ingredients: [global.FoodType.BREAD, global.FoodType.CHEESE],
        requiredStates: [1, 2],
        points: 45
    },
    "Caprese": {
        ingredients: [global.FoodType.TOMATO, global.FoodType.CHEESE],
        requiredStates: [2, 2],
        points: 45
    },
    "Fried Rice": {
        ingredients: [global.FoodType.RICE, global.FoodType.SHRIMP, global.FoodType.STEAK, global.FoodType.LETTUCE],
        requiredStates: [1, 1, 1, 2],
        points: 100
    },
};

const recipeArray = Object.keys(RECIPES);

const FOOD_STATES = {
    0: "Raw",
    1: "Cooked",
    2: "Chopped",
};

function onAwake() {
  // Wait for other components to initialize by deferring to OnStartEvent.
  script.createEvent('OnStartEvent').bind(() => {
    init();
  });
}

function init() {
    thisObject = script.getSceneObject();
    // Create sync entity
    syncEntity = new SyncEntity(script);
    
    scoreProp = StorageProperty.manualInt("score", 0);
    recipeProp = StorageProperty.manualInt("recipeIndex", -1);
    syncEntity.addStorageProperty(scoreProp);
        // Listen for score changes from any player
    scoreProp.onAnyChange.add(function(newValue, oldValue) {
        print("Score changed from " + oldValue + " to " + newValue);
        if (script.scoreText) {
            script.scoreText.text = "Score: " + newValue.toString();
        }
    });
    
    syncEntity.addStorageProperty(recipeProp);
    recipeProp.onAnyChange.add(function(newValue, oldValue) {
        print("Recipe changed from " + oldValue + " to " + newValue);
        
        const recipeName = recipeArray[newValue];
        const recipe = RECIPES[recipeName];
        
        activeRecipe = recipe;
        let ingredientNames = recipe.ingredients.map(i => {
            switch(i) {
                case global.FoodType.TOMATO: return "Tomato";
                case global.FoodType.LETTUCE: return "Lettuce";
                case global.FoodType.BREAD: return "Bread";
                case global.FoodType.MUSHROOM: return "Mushroom";
                case global.FoodType.BACON: return "Bacon";
                case global.FoodType.BUN: return "Bun";
                case global.FoodType.CHEESE: return "Cheese";
                case global.FoodType.PATTY: return "Patty";
                case global.FoodType.RICE: return "Rice";
                case global.FoodType.FISH: return "Fish";
                case global.FoodType.SHRIMP: return "Shrimp";
                case global.FoodType.DOUGH: return "Dough";
                case global.FoodType.STEAK: return "Steak";
            }
        });
        const ingredientStates = recipe.requiredStates.map(s => FOOD_STATES[s]);
        const displayStrings = ingredientNames.map((name, i) => name + " (" + ingredientStates[i] + ")");

        if (script.recipeText) {
            script.recipeText.text = recipeName;
        }
        if (script.ingredientText) {
            script.ingredientText.text = displayStrings.join("\n");
        }  
    });
    
    submissionCount = StorageProperty.manualInt("count", 0);
    syncEntity.addStorageProperty(submissionCount);
    syncEntity.notifyOnReady(onReady);
    
    if (script.showLogs) {
        print("Submission station initialized");
    }
}

function generateRandomRecipe() {
    let recipeLength = recipeArray.length;
    const randomIndex = Math.floor(Math.random() * recipeLength);
    let recipeName = recipeArray[randomIndex];
    recipeProp.setPendingValue(randomIndex);
    activeRecipe = RECIPES[recipeName];
}

function onReady() {
    if (recipeProp.currentOrPendingValue === -1) {
        generateRandomRecipe();
    }
    else {
        const recipeName = recipeArray[recipeProp.currentOrPendingValue];
        activeRecipe = RECIPES[recipeName];
    }
}
script.getScore = function() {
    return scoreProp.currentOrPendingValue;
}

script.getSubmissionCount = function() {
    return submissionCount.currentOrPendingValue;
}

script.getPlate = function(object) {
    checkAndSubmitPlate(object);
}


function onCollisionEnter(e) {
    let collision = e.collision;
    let collidingObject = collision.collider.getSceneObject();
    
    if (script.showLogs) {
        print("Collision detected with: " + collidingObject.name);
    }
    
    // Check if it's a plate
    if (collidingObject.name == "Plate") {
        checkAndSubmitPlate(collidingObject);
    }
}

function checkAndSubmitPlate(plateObject) {
    // Get all food items on the plate
    let foodItems = getFoodOnPlate(plateObject);
    for (let i =0; i < foodItems.length; i++) {
        print(foodItems[i].name);
    }
    if (foodItems.length === 0) {
        print("Empty plate! No submission.");
        return;
    }
    
    // Check if it matches any recipe
    let matchedRecipe = checkRecipe(foodItems);
    if (matchedRecipe) {
        print("got recipe");
        addScore(matchedRecipe.points);
        destroyPlateAndFood(plateObject, foodItems);
        generateRandomRecipe();
        submissionCount.setPendingValue(submissionCount.currentOrPendingValue + 1);
    } else {
        print("Invalid recipe! Try again.");
    }
}

function addScore(value) {
    let currentScore = scoreProp.currentOrPendingValue;
    scoreProp.setPendingValue(currentScore + value);
    print("Score increased by " + value + " to " + (currentScore + value));
}

function getFoodOnPlate(plateObject) {
    let foodItems = [];
    let childCount = plateObject.getChildrenCount();
    
    for (let i = 0; i < childCount; i++) {
        let child = plateObject.getChild(i);
        foodItems.push(child);
    }
    
    return foodItems;
}

function checkRecipe(foodItems) {
    if (!activeRecipe) {
        if (script.showLogs) print("No active recipe set.");
        return null;
    }

    // quick mismatch on counts: require exact number of items
    if (foodItems.length !== activeRecipe.ingredients.length) {
        print("food length not right")
        return null;
    }

    let requiredIngredients = activeRecipe.ingredients.slice(); // [foodType, ...]
    let requiredStates = activeRecipe.requiredStates.slice();   // [state, ...]

    // keep track of which foodItems have been used
    let used = new Array(foodItems.length).fill(false);

    // For each required ingredient, try to find a matching item on the plate
    for (let reqIdx = 0; reqIdx < requiredIngredients.length; reqIdx++) {
        let reqFoodType = requiredIngredients[reqIdx];
        let reqState = requiredStates[reqIdx];

        let matched = false;
        for (let f = 0; f < foodItems.length; f++) {
            if (used[f]) continue; // already matched
            let item = foodItems[f];

            // item.foodName is expected to be the enum value (e.g. global.FoodType.TOMATO)
            let itemName = item.foodName;
            let itemStateProp = item.foodState;

            if (itemName === undefined || itemStateProp === undefined) {
                print("item undefined");
                continue;
            }

            // Read the current or pending state (this is the usual way)
            let itemState = itemStateProp.currentOrPendingValue;
            
            // Match if same food type and same state
            if (itemName === reqFoodType && itemState === reqState) {
                used[f] = true;
                matched = true;
                break;
            }
        }

        if (!matched) {
            print("no match");
            return null; // recipe doesn't match
        }
    }

    // If we reached here all required ingredients were matched exactly once
    return { points: activeRecipe.points };
}

function destroyPlateAndFood(plateObject, foodItems) {
    // Destroy all food items
    for (let i = 0; i < foodItems.length; i++) {
        foodItems[i].destroy();
    }
    
    // Destroy the plate
    plateObject.destroy();
    
    print("Plate and food destroyed!");
    spawnNewPlate();
}

function spawnNewPlate() {
    print(originalPlatePos);
    script.kitchenManager.spawnObject(script.platePrefab, originalPlatePos);
}

onAwake();
