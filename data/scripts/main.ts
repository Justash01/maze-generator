import { MazeGenerator } from "./utils";
import { Player, system, ScriptEventCommandMessageAfterEvent } from "@minecraft/server";
import * as UI from "@minecraft/server-ui";

system.afterEvents.scriptEventReceive.subscribe((eventData: ScriptEventCommandMessageAfterEvent) => {
  const { id, sourceEntity } = eventData;

  if (sourceEntity instanceof Player && id === "gen:maze") {
    const player = sourceEntity;
    const menu = new UI.ModalFormData();

    menu.title("Maze Generator");
    menu.slider("\nHeight", 11, 45, 2, 32);
    menu.slider("Width", 11, 45, 2, 32);
    menu.slider("Walls Height", 1, 15, 1, 5);
    menu.textField("Walls Block Type", "Block Id(s) separated by comma", "stone_bricks, mossy_stone_bricks");
    menu.textField("Path Block Type", "Block Id(s) separated by comma", "dirt, grass_path");
    menu.submitButton("Generate");

    menu.show(player).then((result: UI.ModalFormResponse) => {
      if (result.canceled || !result.formValues) return;

      const width = Number(result.formValues[0]);
      const height = Number(result.formValues[1]);
      const wallHeight = Number(result.formValues[2]);
      const wallBlocks = (result.formValues[3] as string)?.split(",").map(block => block.trim()) || [];
      const pathBlocks = (result.formValues[4] as string)?.split(",").map(block => block.trim()) || [];

      // Generates the maze
      const oddWidth = width % 2 === 0 ? width + 1 : width;
      const oddHeight = height % 2 === 0 ? height + 1 : height;
      const mazeGenerator = new MazeGenerator(player, oddWidth, oddHeight, wallHeight);
      mazeGenerator.setWallBlock(wallBlocks);
      mazeGenerator.setPathBlock(pathBlocks);
      system.runJob(mazeGenerator.generateMaze());
    });
  }
});