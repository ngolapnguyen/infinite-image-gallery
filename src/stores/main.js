import create from "zustand";
import * as THREE from "three";
import { getTextureFactor } from "utils";
import gridShader from "shaders/gridShader";

/**
 * We'll be using a (unit * size) system
 */

// Demo data length
export const DATA_LENGTH = 30;
// Default grid size unit - 100px
export const GRID_SIZE_UNIT = 100;
// Default grid column width - 100 x 3 = 300px
export const GRID_COLUMN_WIDTH = 4;
// Default center offset (so that the column can be in the middle of the screen)
export const GRID_X_OFFSET = GRID_COLUMN_WIDTH / 2;
// Minimum item height
export const GRID_ITEM_MIN_HEIGHT = 3;
// Maximum item height
export const GRID_ITEM_MAX_HEIGHT = 7;
// Grid item padding
export const GRID_ITEM_PADDING = 0.2;
// Number of grid column
export const GRID_COLUMN_COUNT = 6;
// Grid item per column
export const GRID_ITEM_PER_COLUMN = DATA_LENGTH / GRID_COLUMN_COUNT;

const TextureLoader = new THREE.TextureLoader();

const [useMainStore] = create((set) => ({
  grid: [],
  gridColumnHeights: [],
  dataLoaded: false,
  loadData: async () => {
    let data = [];
    let grid = [];
    // Variable to keep track of each column's height
    let gridColumnHeights = [];
    // All texture loading promises
    let textureLoadingPromises = [];

    for (let i = 0; i < DATA_LENGTH; i++) {
      const texture = await fetch(
        `https://picsum.photos/seed/${
          Math.round(Math.random() * 300) + i
        }/1024/1024`
      ).then((res) => res.url);

      textureLoadingPromises.push(
        new Promise((resolve) => {
          const loadDone = (texture) => {
            resolve(texture);
          };

          TextureLoader.load(texture, loadDone);
        })
      );
    }

    const initGrid = () => {
      // Init the empty grid
      grid = grid.map((row) =>
        row.map(() => new Array(data.length).fill(null))
      );
      // Total width of the grid
      const totalWidth = GRID_COLUMN_COUNT * GRID_COLUMN_WIDTH;

      // Generate the grid data based on gridItemPerColumn & data
      let gridData = [];
      // Start x coord of the grid, with the center of the screen as the origin (0, 0)
      let currentX = 0 - (totalWidth / 2 - GRID_X_OFFSET);
      // Current y coord of the item
      let currentY = 0;
      // Max height among all columns, used to re-calculate the y coord of the items
      let maxHeight = 0;
      // Storing the current vertical offset of each column
      let verticalOffset = 0;
      data.forEach((entry, index) => {
        // On populating a new column
        if (index % GRID_ITEM_PER_COLUMN === 0) {
          // If not the first column, increase x
          if (index !== 0) {
            currentX += GRID_COLUMN_WIDTH;
          }

          // Add some vertical offset to make the column un-even
          verticalOffset = ((index / GRID_ITEM_PER_COLUMN) % 2) * 2;
          currentY = verticalOffset;
        }

        // Random an item's height in predetermined range
        const height = Math.round(
          Math.random() * (GRID_ITEM_MAX_HEIGHT - GRID_ITEM_MIN_HEIGHT) +
            GRID_ITEM_MIN_HEIGHT
        );

        // Push the new item
        // Here we re-calculate the y to pretend that we set top-left
        // as the transform origin for the item
        gridData.push({
          ...entry,
          x: currentX,
          y: currentY + height / 2,
          height,
        });

        // Increase y, preparing for the next item
        currentY = currentY + height;

        // If this is the last item in the column
        if ((index + 1) % GRID_ITEM_PER_COLUMN === 0) {
          // Compare & set max height among all columns
          if (currentY > maxHeight) {
            maxHeight = currentY;
          }

          // Save current column height, after deducting the initial vertical offset
          gridColumnHeights.push(currentY - verticalOffset);
        }
      });

      // Re-calculate the y coord of each item
      // & map geometry & material
      gridData = gridData.map((entry) => {
        let zOffset = Math.random() * 4 - 2;

        return {
          ...entry,
          y: entry.y - maxHeight / 2,
          geometry: new THREE.PlaneBufferGeometry(
            GRID_COLUMN_WIDTH - GRID_ITEM_PADDING,
            entry.height - GRID_ITEM_PADDING,
            100,
            100
          ),
          material: new THREE.ShaderMaterial({
            uniforms: {
              uTexture: {
                type: "t",
                value: entry.texture,
              },
              uTextureFactor: {
                type: "f",
                value: getTextureFactor(
                  (GRID_COLUMN_WIDTH - GRID_ITEM_PADDING) /
                    (entry.height - GRID_ITEM_PADDING),
                  entry.texture
                ),
              },
              uResolution: {
                type: "f",
                value: new THREE.Vector2(GRID_COLUMN_WIDTH, entry.height),
              },
              uDistanceDiffFromCamera: {
                type: "f",
                value: new THREE.Vector2(0, 0),
              },
              uMouseDownProgress: {
                type: "f",
                value: 0,
              },
              uOffsetProgress: {
                type: "f",
                value: 0,
              },
              uZOffset: {
                type: "f",
                value: zOffset,
              },
              uBrightness: {
                type: "f",
                value: 1,
              },
            },
            vertexShader: gridShader.vertexShader,
            fragmentShader: gridShader.fragmentShader,
            transparent: true,
            side: THREE.DoubleSide,
          }),
        };
      });

      return gridData;
    };

    Promise.all(textureLoadingPromises).then((textures) => {
      textures.forEach((entry, index) => {
        data.push({
          title: `Image ${index}`,
          description:
            "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Pellentesque gravida...",
          texture: entry,
        });
      });

      grid = initGrid();
      set({ grid, dataLoaded: true, gridColumnHeights });
    });
  },

  gridNeedsUpdate: false,
  setGridNeedsUpdate: (gridNeedsUpdate) => set({ gridNeedsUpdate }),

  mouseDown: false,
  setMouseDown: (mouseDown) => set({ mouseDown }),
}));

export default useMainStore;
