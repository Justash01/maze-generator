import { Player, Vector3, Dimension } from "@minecraft/server";

export class MazeGenerator {
  private width: number;
  private height: number;
  private wallHeight: number;
  private player: Player;
  private dimension: Dimension;
  private startLocation: Vector3;
  private maze: number[][];
  private wallBlocks: string[] = ["minecraft:stone"];
  private pathBlocks: string[] = ["minecraft:dirt"];

  /**
   * Creates a new MazeGenerator.
   * @param player The source player
   * @param width Width of the Maze
   * @param height Height of the Maze
   * @param wallHeight Height of the walls in the Maze
   */
  constructor(player: Player, width: number, height: number, wallHeight: number) {
    this.player = player;
    this.dimension = player.dimension;

    // Offset maze to avoid spawning on the player
    this.startLocation = {
      x: Math.floor(player.location.x) + 1,
      y: Math.floor(player.location.y),
      z: Math.floor(player.location.z) + 1,
    };

    this.width = width;
    this.height = height;
    this.wallHeight = wallHeight;
    this.maze = [];
  }
  
  setWallBlock(blocks: string[]) {
    if (blocks && blocks.length > 0) {
      this.wallBlocks = blocks;
    }
  }

  setPathBlock(blocks: string[]) {
    if (blocks && blocks.length > 0) {
      this.pathBlocks = blocks;
    }
  }

  /**
   * Generates the maze
   */
  *generateMaze() {
    this.initializeMazeGrid();

    const startX = 1;
    const startZ = 1;
    this.maze[startX][startZ] = 0;

    yield* this.iterativeBacktracker(startX, startZ);

    // Create entrance and exit
    this.maze[startX][0] = 0;
    this.maze[this.width - 2][this.height - 1] = 0;

    yield* this.renderMazeChunks();
  }

  private initializeMazeGrid() {
    for (let x = 0; x < this.width; x++) {
      this.maze[x] = [];
      for (let z = 0; z < this.height; z++) {
        this.maze[x][z] = 1; // 1 represents walls
      }
    }
  }

  /**
   * Generates the maze using an iterative backtracking algorithm
   * @param startX The starting x-coordinate
   * @param startZ The starting z-coordinate
   */
  private *iterativeBacktracker(startX: number, startZ: number) {
    const stack: { x: number; z: number }[] = [];
    const directions = [
      { dx: 0, dz: 2 },
      { dx: 2, dz: 0 },
      { dx: 0, dz: -2 },
      { dx: -2, dz: 0 },
    ];

    stack.push({ x: startX, z: startZ });
    this.maze[startX][startZ] = 0;

    while (stack.length > 0) {
      const { x, z } = stack[stack.length - 1];
      const shuffledDirections = this.shuffleArray(directions);

      let moved = false;
      for (const dir of shuffledDirections) {
        const newX = x + dir.dx;
        const newZ = z + dir.dz;

        if (this.canCarvePath(newX, newZ)) {
          this.carvePath(x, z, dir);
          stack.push({ x: newX, z: newZ });
          moved = true;
          break;
        }
      }

      if (!moved) {
        stack.pop();
      }

      yield;
    }
  }

  /**
   * Checks if a path can be carved at a given position
   * @param x The x-coordinate
   * @param z The z-coordinate
   */
  private canCarvePath(x: number, z: number): boolean {
    return (
      x > 0 &&
      x < this.width - 1 &&
      z > 0 &&
      z < this.height - 1 &&
      this.maze[x][z] === 1
    );
  }

  /**
   * Carves a path in the maze
   * @param x The current x-coordinate
   * @param z The current z-coordinate
   * @param dir The direction in which to carve
   */
  private carvePath(x: number, z: number, dir: { dx: number; dz: number }) {
    this.maze[x + dir.dx][z + dir.dz] = 0;
    this.maze[x + dir.dx / 2][z + dir.dz / 2] = 0;
  }

  /**
   * Renders the maze in chunks
   */
  private *renderMazeChunks() {
    const chunkSize = 10;
    const groundY = this.startLocation.y - 1;

    for (let x = 0; x < this.width; x += chunkSize) {
      for (let z = 0; z < this.height; z += chunkSize) {
        for (let dx = 0; dx < chunkSize && x + dx < this.width; dx++) {
          for (let dz = 0; dz < chunkSize && z + dz < this.height; dz++) {
            const worldX = this.startLocation.x + x + dx;
            const worldZ = this.startLocation.z + z + dz;

            if (this.maze[x + dx][z + dz] === 1) {
              const randomWallBlock =
                this.wallBlocks[Math.floor(Math.random() * this.wallBlocks.length)];
              for (let y = 0; y < this.wallHeight; y++) {
                this.dimension.setBlockType(
                  { x: worldX, y: groundY + y + 1, z: worldZ },
                  randomWallBlock
                );
              }
            } else {
              const randomPathBlock =
                this.pathBlocks[Math.floor(Math.random() * this.pathBlocks.length)];
              this.dimension.setBlockType(
                { x: worldX, y: groundY, z: worldZ },
                randomPathBlock
              );
            }
          }
        }
        yield;
      }
    }

    const entranceX = this.startLocation.x + 1;
    const entranceZ = this.startLocation.z;
    const exitX = this.startLocation.x + this.width - 2;
    const exitZ = this.startLocation.z + this.height - 1;

    this.dimension.setBlockType({ x: entranceX, y: groundY, z: entranceZ }, "gold_block");
    this.dimension.setBlockType({ x: exitX, y: groundY, z: exitZ }, "diamond_block");
  }

  private shuffleArray<T>(array: T[]): T[] {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }
}