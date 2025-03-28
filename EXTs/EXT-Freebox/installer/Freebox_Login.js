const { FreeboxRegister } = require("../components/freebox");

var count = 1;

async function main () {
  await new FreeboxRegister(
    {
      app_id: "fbx.EXT-Freebox",
      app_name: "EXT-Freebox",
      app_version: "2.0.0",
      device_name: "MagicMirror²"
    }
  ).register();
}

function retry () {
  console.log(`Retry... ${count}/10`);
  count++;
  main().catch((err) => {
    console.log(`[Freebox][Error] ${err}`);
    if (count < 11) retry();
  });
}

main().catch(() => retry());
