// @input Component.ScriptComponent kitchenManager;
// @input SceneObject originalPlate;
// @input Asset.ObjectPrefab platePrefab;

const SIK = require('SpectaclesInteractionKit.lspkg/SIK').SIK;
const interactionConfiguration = SIK.InteractionConfiguration;

var originalPlatePos = script.originalPlate.getTransform().getWorldPosition();
print(originalPlatePos);
function onAwake() {
  // Wait for other components to initialize by deferring to OnStartEvent.
  script.createEvent('OnStartEvent').bind(() => {
    onStart();
  });
}

function onStart() {
  // This script assumes that a ToggleButton (and Interactable + Collider) component have already been instantiated on the SceneObject.
  var toggleButton = script.sceneObject.getComponent(
    interactionConfiguration.requireType('ToggleButton')
  );

  var onStateChangedCallback = (state) => {
    print("The toggle button was triggered!");
    script.kitchenManager.spawnObject(script.platePrefab, originalPlatePos);
  };

  toggleButton.onStateChanged.add(onStateChangedCallback);
}

onAwake();