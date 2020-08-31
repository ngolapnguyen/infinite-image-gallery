import React, { useEffect, useState, Suspense, useRef, useMemo } from "react";
import useMainStore from "stores/main";
import GridItem from "components/GridItem";
import { useThree, useFrame } from "react-three-fiber";
import * as THREE from "three";
import debounce from "lodash.debounce";

/**
 * We'll be using a (unit * size) system
 */

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

// Frustum to determine if an item is in view
const frustum = new THREE.Frustum();
let cameraViewProjectionMatrix = new THREE.Matrix4();

const emptyMatrixString = JSON.stringify([
  [[], [], []],
  [[], [], []],
  [[], [], []],
]);

const Grid = () => {
  const { data, gridNeedsUpdate } = useMainStore();
  const { camera } = useThree();

  const [grid, setGrid] = useState([]);
  // Ref to keep track of item per column
  const gridItemPerColumn = useRef(data.length / GRID_COLUMN_COUNT);
  // Ref to keep track of each column's height
  const gridColumnHeights = useRef([]);
  // A matrix to keep track of all items' ref
  // Flatten out array will be in this order:
  // topLeft, topMid, topRight, midLeft, mid, midRight, bottomLeft, bottomMid, bottomRight
  // There could be a more generic way to handle this, but considering the complexity
  // & the scope of the project, I'll just hard-code it ._.
  // More-over, at the time I'm writting this, I have not worked out all the logic
  // So hard-coding here could help a bit with my thinking. Optimize later, I guess
  const gridItemRefs = useRef(JSON.parse(emptyMatrixString));
  const gridOrderRef = useRef([
    [
      [0, 0],
      [1, 0],
      [2, 0],
    ],
    [
      [0, 1],
      [1, 1],
      [2, 1],
    ],
    [
      [0, 2],
      [1, 2],
      [2, 2],
    ],
  ]);
  // Row/column index of the grid bound. Upon transforming the grid,
  // the row/col will jump around, so we need this to keep track
  const gridBoundRef = useRef({
    top: 0,
    bottom: 2,
    left: 0,
    right: 2,
  });

  const initGrid = () => {
    // Update the gridItemRefs
    gridItemRefs.current = gridItemRefs.current.map((row) =>
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
      if (index % gridItemPerColumn.current === 0) {
        // If not the first column, increase x
        if (index !== 0) {
          currentX += GRID_COLUMN_WIDTH;
        }

        // Add some vertical offset to make the column un-even
        verticalOffset = ((index / gridItemPerColumn.current) % 2) * 2;
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
        x: currentX,
        y: currentY + height / 2,
        height,
        ...entry,
      });

      // Increase y, preparing for the next item
      currentY = currentY + height;

      // If this is the last item in the column
      if ((index + 1) % gridItemPerColumn.current === 0) {
        // Compare & set max height among all columns
        if (currentY > maxHeight) {
          maxHeight = currentY;
        }

        // Save current column height, after deducting the initial vertical offset
        gridColumnHeights.current.push(currentY - verticalOffset);
      }
    });

    // Re-calculate the y coord of each item
    gridData = gridData.map((entry) => ({
      ...entry,
      y: entry.y - maxHeight / 2,
    }));
    setGrid(gridData);
  };

  // Update grid when needed, debounced for performance
  // This contains the logic to repeat the grids indefinitely
  const updateGrid = debounce(() => {
    let visibility = {
      top: false,
      bottom: false,
      left: false,
      right: false,
    };
    const checkStatus = {
      vertical: false,
      horizontal: false,
    };

    // Get all grids in current correct order
    const orderedGrids = JSON.parse(emptyMatrixString);
    gridOrderRef.current.forEach((row, rowIndex) => {
      row.forEach((col, colIndex) => {
        orderedGrids[col[1]][col[0]] = gridItemRefs.current[rowIndex][colIndex];
      });
    });

    // /**
    //  * Horizontal check
    //  */

    // Check if left bound's first column's items are visible
    for (let i = 0; i < gridItemPerColumn.current; i++) {
      if (
        frustum.intersectsObject(orderedGrids[0][0][i]) ||
        frustum.intersectsObject(orderedGrids[1][0][i]) ||
        frustum.intersectsObject(orderedGrids[2][0][i])
      ) {
        visibility.left = true;
        checkStatus.horizontal = true;
        break;
      }
    }

    // Check if right bound's last column's items are visible
    if (!checkStatus.horizontal) {
      for (let i = 0; i < gridItemPerColumn.current; i++) {
        const index = (GRID_COLUMN_COUNT - 1) * gridItemPerColumn.current + i;

        if (
          frustum.intersectsObject(orderedGrids[0][2][index]) ||
          frustum.intersectsObject(orderedGrids[1][2][index]) ||
          frustum.intersectsObject(orderedGrids[2][2][index])
        ) {
          visibility.right = true;
          break;
        }
      }
    }

    /**
     * Vertical check
     */

    // Check if top row's top items are visible
    for (let i = 0; i < GRID_COLUMN_COUNT; i++) {
      const index = gridItemPerColumn.current * (i + 1) - 1;

      if (
        frustum.intersectsObject(orderedGrids[0][0][index]) ||
        frustum.intersectsObject(orderedGrids[0][1][index]) ||
        frustum.intersectsObject(orderedGrids[0][2][index])
      ) {
        visibility.top = true;
        checkStatus.vertical = true;
        break;
      }
    }

    // Check if bottom row's bottom items are visible
    if (!checkStatus.vertical) {
      for (let i = 0; i < GRID_COLUMN_COUNT; i++) {
        const index = gridItemPerColumn.current * i;

        if (
          frustum.intersectsObject(orderedGrids[2][0][index]) ||
          frustum.intersectsObject(orderedGrids[2][1][index]) ||
          frustum.intersectsObject(orderedGrids[2][2][index])
        ) {
          visibility.bottom = true;
          break;
        }
      }
    }

    // If top bound is visible, update the bottom row's items' position
    // and vice versal for bottom bound
    if (visibility.top) {
      console.log("top");
      if (gridOrderRef.current[gridBoundRef.current.top][0][1] === 0) {
        console.log("dup top");
        grid.forEach((_, index) => {
          const column = Math.floor(index / gridItemPerColumn.current);
          const offset = gridColumnHeights.current[column] * 3;
          orderedGrids[2][0][index].position.y += offset;
          orderedGrids[2][1][index].position.y += offset;
          orderedGrids[2][2][index].position.y += offset;
        });

        gridOrderRef.current = gridOrderRef.current.map((row) => {
          return row.map((value) => [value[0], (value[1] + 1) % 3]);
        });

        gridBoundRef.current.top = (gridBoundRef.current.top + 2) % 3;
      }
    } else if (visibility.bottom) {
      console.log("bot");
      if (gridOrderRef.current[gridBoundRef.current.bottom][0][1] === 2) {
        console.log("dup bot");
        grid.forEach((_, index) => {
          const column = Math.floor(index / gridItemPerColumn.current);
          const offset = gridColumnHeights.current[column] * 3;
          orderedGrids[0][0][index].position.y -= offset;
          orderedGrids[0][1][index].position.y -= offset;
          orderedGrids[0][2][index].position.y -= offset;
        });

        gridOrderRef.current = gridOrderRef.current.map((row) => {
          return row.map((value) => [value[0], (value[1] + 2) % 3]);
        });

        gridBoundRef.current.bottom = (gridBoundRef.current.bottom + 1) % 3;
      }
    }

    // If left bound is visible, update the right bound's items' position
    // and vice versal for right bound
    if (visibility.left) {
      console.log("left");
      if (gridOrderRef.current[0][gridBoundRef.current.left][0] === 0) {
        console.log("dup left");
        grid.forEach((_, index) => {
          const offset = GRID_COLUMN_COUNT * GRID_COLUMN_WIDTH * 3;
          orderedGrids[0][2][index].position.x -= offset;
          orderedGrids[1][2][index].position.x -= offset;
          orderedGrids[2][2][index].position.x -= offset;
        });

        gridOrderRef.current = gridOrderRef.current.map((row) => {
          return row.map((value) => [(value[0] + 1) % 3, value[1]]);
        });

        gridBoundRef.current.left = (gridBoundRef.current.left + 2) % 3;
      }
    } else if (visibility.right) {
      console.log("right");
      if (gridOrderRef.current[0][gridBoundRef.current.right][0] === 2) {
        console.log("dup right");
        grid.forEach((_, index) => {
          const offset = GRID_COLUMN_COUNT * GRID_COLUMN_WIDTH * 3;
          orderedGrids[0][0][index].position.x += offset;
          orderedGrids[1][0][index].position.x += offset;
          orderedGrids[2][0][index].position.x += offset;
        });

        gridOrderRef.current = gridOrderRef.current.map((row) => {
          return row.map((value) => [(value[0] + 2) % 3, value[1]]);
        });

        gridBoundRef.current.right = (gridBoundRef.current.right + 1) % 3;
      }
    }
  }, 500);

  // Init
  useEffect(() => {
    initGrid();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Update every frame
  useFrame(() => {
    if (gridNeedsUpdate) {
      // Make sure the camera matrix is updated
      camera.updateMatrixWorld();
      camera.matrixWorldInverse.getInverse(camera.matrixWorld);
      cameraViewProjectionMatrix.multiplyMatrices(
        camera.projectionMatrix,
        camera.matrixWorldInverse
      );
      frustum.setFromProjectionMatrix(cameraViewProjectionMatrix);

      // Frustum is now ready to check all the objects you need
      updateGrid();
    }
  });

  // FIXME: Find a neater way (but still clear & easy to read)
  // Performance is also suffering in term of stability, really should fix

  const gridRender = useMemo(
    () =>
      grid.map((entry, index) => (
        <Suspense fallback={null} key={index}>
          {/* Top row */}
          <GridItem
            data={entry}
            ref={(ref) => (gridItemRefs.current[0][0][index] = ref)}
            position={[
              entry.x - GRID_COLUMN_WIDTH * GRID_COLUMN_COUNT,
              entry.y +
                gridColumnHeights.current[
                  Math.floor(index / gridItemPerColumn.current)
                ],
              0,
            ]}
          />
          <GridItem
            data={entry}
            ref={(ref) => (gridItemRefs.current[0][1][index] = ref)}
            position={[
              entry.x,
              entry.y +
                gridColumnHeights.current[
                  Math.floor(index / gridItemPerColumn.current)
                ],
              0,
            ]}
          />
          <GridItem
            data={entry}
            ref={(ref) => (gridItemRefs.current[0][2][index] = ref)}
            position={[
              entry.x + GRID_COLUMN_WIDTH * GRID_COLUMN_COUNT,
              entry.y +
                gridColumnHeights.current[
                  Math.floor(index / gridItemPerColumn.current)
                ],
              0,
            ]}
          />

          {/* Mid row */}
          <GridItem
            data={entry}
            ref={(ref) => (gridItemRefs.current[1][0][index] = ref)}
            position={[
              entry.x - GRID_COLUMN_WIDTH * GRID_COLUMN_COUNT,
              entry.y,
              0,
            ]}
          />
          <GridItem
            data={entry}
            ref={(ref) => (gridItemRefs.current[1][1][index] = ref)}
            position={[entry.x, entry.y, 0]}
          />
          <GridItem
            data={entry}
            ref={(ref) => (gridItemRefs.current[1][2][index] = ref)}
            position={[
              entry.x + GRID_COLUMN_WIDTH * GRID_COLUMN_COUNT,
              entry.y,
              0,
            ]}
          />

          {/* Bottom row */}
          <GridItem
            data={entry}
            ref={(ref) => (gridItemRefs.current[2][0][index] = ref)}
            position={[
              entry.x - GRID_COLUMN_WIDTH * GRID_COLUMN_COUNT,
              entry.y -
                gridColumnHeights.current[
                  Math.floor(index / gridItemPerColumn.current)
                ],
              0,
            ]}
          />
          <GridItem
            data={entry}
            ref={(ref) => (gridItemRefs.current[2][1][index] = ref)}
            position={[
              entry.x,
              entry.y -
                gridColumnHeights.current[
                  Math.floor(index / gridItemPerColumn.current)
                ],
              0,
            ]}
          />
          <GridItem
            data={entry}
            ref={(ref) => (gridItemRefs.current[2][2][index] = ref)}
            position={[
              entry.x + GRID_COLUMN_WIDTH * GRID_COLUMN_COUNT,
              entry.y -
                gridColumnHeights.current[
                  Math.floor(index / gridItemPerColumn.current)
                ],
              0,
            ]}
          />
        </Suspense>
      )),
    [grid]
  );

  return <group>{gridRender}</group>;
};

export default Grid;
