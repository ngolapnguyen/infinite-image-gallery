import React, { useRef, useMemo, useState, useEffect } from "react";
import useMainStore, {
  GRID_ITEM_PER_COLUMN,
  GRID_COLUMN_COUNT,
  GRID_COLUMN_WIDTH,
  DATA_LENGTH,
} from "stores/main";
import { useThree, useFrame } from "react-three-fiber";
import * as THREE from "three";
import throttle from "lodash.throttle";
import { useSpring, config } from "react-spring/three";
import GridItem from "components/GridItem";

// Frustum to determine if an item is in view
const frustum = new THREE.Frustum();
let cameraViewProjectionMatrix = new THREE.Matrix4();

const emptyMatrixString = JSON.stringify([
  [[], [], []],
  [[], [], []],
  [[], [], []],
]);

const Grid = () => {
  const { grid, gridColumnHeights, gridNeedsUpdate } = useMainStore();
  const { camera } = useThree();

  const { mouseDownProgress } = useSpring({
    mouseDownProgress: gridNeedsUpdate ? 1 : 0,
    config: {
      mass: 5,
      tension: 800,
      friction: 120,
    },
  });

  const [showGrid, setShowGrid] = useState(false);
  const { offsetProgress } = useSpring({
    offsetProgress: showGrid ? 0 : 1,
    config: config.gentle,
  });

  // A matrix to keep track of all items' ref
  // Flatten out array will be in this order:
  // topLeft, topMid, topRight, midLeft, mid, midRight, bottomLeft, bottomMid, bottomRight
  // There could be a more generic way to handle this, but considering the complexity
  // & the scope of the project, I'll just hard-code it ._.
  // More-over, at the time I'm writting this, I have not worked out all the logic
  // So hard-coding here could help a bit with my thinking. Optimize later, I guess
  const gridItemRefs = useRef(
    JSON.parse(emptyMatrixString).map((row) =>
      row.map(() => new Array(DATA_LENGTH).fill(null))
    )
  );
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

  // Update grid when needed, debounced for performance
  // This contains the logic to repeat the grids indefinitely
  const updateGrid = throttle(() => {
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
    for (let i = 0; i < GRID_ITEM_PER_COLUMN; i++) {
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
      for (let i = 0; i < GRID_ITEM_PER_COLUMN; i++) {
        const index = (GRID_COLUMN_COUNT - 1) * GRID_ITEM_PER_COLUMN + i;

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
      const index = GRID_ITEM_PER_COLUMN * (i + 1) - 1;

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
        const index = GRID_ITEM_PER_COLUMN * i;

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
          const column = Math.floor(index / GRID_ITEM_PER_COLUMN);
          const offset = gridColumnHeights[column] * 3;
          orderedGrids[2][0][index].position.y += offset;
          orderedGrids[2][1][index].position.y += offset;
          orderedGrids[2][2][index].position.y += offset;
        });

        gridOrderRef.current = gridOrderRef.current.map((row) => {
          return row.map((value) => [value[0], (value[1] + 1) % 3]);
        });

        gridBoundRef.current.top = (gridBoundRef.current.top + 2) % 3;
        gridBoundRef.current.bottom = (gridBoundRef.current.bottom + 2) % 3;
      }
    } else if (visibility.bottom) {
      console.log("bot");
      if (gridOrderRef.current[gridBoundRef.current.bottom][0][1] === 2) {
        console.log("dup bot");
        grid.forEach((_, index) => {
          const column = Math.floor(index / GRID_ITEM_PER_COLUMN);
          const offset = gridColumnHeights[column] * 3;
          orderedGrids[0][0][index].position.y -= offset;
          orderedGrids[0][1][index].position.y -= offset;
          orderedGrids[0][2][index].position.y -= offset;
        });

        gridOrderRef.current = gridOrderRef.current.map((row) => {
          return row.map((value) => [value[0], (value[1] + 2) % 3]);
        });

        gridBoundRef.current.top = (gridBoundRef.current.top + 1) % 3;
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
        gridBoundRef.current.right = (gridBoundRef.current.right + 2) % 3;
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

        gridBoundRef.current.left = (gridBoundRef.current.left + 1) % 3;
        gridBoundRef.current.right = (gridBoundRef.current.right + 1) % 3;
      }
    }
  }, 300);

  useEffect(() => {
    setShowGrid(true);
  }, []);

  // FIXME: Find a neater way (but still clear & easy to read)
  // Performance is also suffering in term of stability, really should fix
  const gridRender = useMemo(
    () => {
      const topLeft = grid.map((entry, index) => (
        <GridItem
          key={`tl-${index}`}
          data={entry}
          ref={(ref) => (gridItemRefs.current[0][0][index] = ref)}
          position={[
            entry.x - GRID_COLUMN_WIDTH * GRID_COLUMN_COUNT,
            entry.y +
              gridColumnHeights[Math.floor(index / GRID_ITEM_PER_COLUMN)],
            0,
          ]}
        />
      ));

      const topMid = grid.map((entry, index) => (
        <GridItem
          key={`tm-${index}`}
          data={entry}
          ref={(ref) => (gridItemRefs.current[0][1][index] = ref)}
          position={[
            entry.x,
            entry.y +
              gridColumnHeights[Math.floor(index / GRID_ITEM_PER_COLUMN)],
            0,
          ]}
        />
      ));

      const topRight = grid.map((entry, index) => (
        <GridItem
          key={`tr-${index}`}
          data={entry}
          ref={(ref) => (gridItemRefs.current[0][2][index] = ref)}
          position={[
            entry.x + GRID_COLUMN_WIDTH * GRID_COLUMN_COUNT,
            entry.y +
              gridColumnHeights[Math.floor(index / GRID_ITEM_PER_COLUMN)],
            0,
          ]}
        />
      ));

      const midLeft = grid.map((entry, index) => (
        <GridItem
          key={`ml-${index}`}
          data={entry}
          ref={(ref) => (gridItemRefs.current[1][0][index] = ref)}
          position={[
            entry.x - GRID_COLUMN_WIDTH * GRID_COLUMN_COUNT,
            entry.y,
            0,
          ]}
        />
      ));

      const mid = grid.map((entry, index) => (
        <GridItem
          key={`m-${index}`}
          data={entry}
          ref={(ref) => (gridItemRefs.current[1][1][index] = ref)}
          position={[entry.x, entry.y, 0]}
        />
      ));

      const midRight = grid.map((entry, index) => (
        <GridItem
          key={`mr-${index}`}
          data={entry}
          ref={(ref) => (gridItemRefs.current[1][2][index] = ref)}
          position={[
            entry.x + GRID_COLUMN_WIDTH * GRID_COLUMN_COUNT,
            entry.y,
            0,
          ]}
        />
      ));

      const bottomLeft = grid.map((entry, index) => (
        <GridItem
          key={`bl-${index}`}
          data={entry}
          ref={(ref) => (gridItemRefs.current[2][0][index] = ref)}
          position={[
            entry.x - GRID_COLUMN_WIDTH * GRID_COLUMN_COUNT,
            entry.y -
              gridColumnHeights[Math.floor(index / GRID_ITEM_PER_COLUMN)],
            0,
          ]}
        />
      ));

      const bottomMid = grid.map((entry, index) => (
        <GridItem
          key={`bm-${index}`}
          data={entry}
          ref={(ref) => (gridItemRefs.current[2][1][index] = ref)}
          position={[
            entry.x,
            entry.y -
              gridColumnHeights[Math.floor(index / GRID_ITEM_PER_COLUMN)],
            0,
          ]}
        />
      ));

      const bottomRight = grid.map((entry, index) => (
        <GridItem
          key={`br-${index}`}
          data={entry}
          ref={(ref) => (gridItemRefs.current[2][2][index] = ref)}
          position={[
            entry.x + GRID_COLUMN_WIDTH * GRID_COLUMN_COUNT,
            entry.y -
              gridColumnHeights[Math.floor(index / GRID_ITEM_PER_COLUMN)],
            0,
          ]}
        />
      ));

      return {
        topLeft,
        topMid,
        topRight,
        midLeft,
        mid,
        midRight,
        bottomLeft,
        bottomMid,
        bottomRight,
      };
    },
    [grid] // eslint-disable-line react-hooks/exhaustive-deps
  );

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

      gridItemRefs.current.forEach((row) =>
        row.forEach((col) =>
          col.forEach((entry) => {
            const deltaX = entry.position.x - camera.position.x;
            const deltaY = entry.position.y - camera.position.y;
            if (Math.abs(deltaX) < 10 && Math.abs(deltaY) < 10) {
              entry.material.uniforms.uDistanceDiffFromCamera.value = new THREE.Vector2(
                deltaX,
                deltaY
              );
            }
          })
        )
      );
    }

    gridItemRefs.current.forEach((row) =>
      row.forEach((col) =>
        col.forEach((entry) => {
          const deltaX = entry.position.x - camera.position.x;
          const deltaY = entry.position.y - camera.position.y;
          if (
            Math.abs(deltaX) < 10 &&
            Math.abs(deltaY) < 10 &&
            entry.material.uniforms
          ) {
            entry.material.uniforms.uMouseDownProgress.value =
              mouseDownProgress.value;
          }

          entry.material.uniforms.uOffsetProgress.value = offsetProgress.value;
        })
      )
    );
  });

  return (
    <group position={[0, 0, 0.01]}>
      {gridRender.topLeft}
      {gridRender.topMid}
      {gridRender.topRight}
      {gridRender.midLeft}
      {gridRender.mid}
      {gridRender.midRight}
      {gridRender.bottomLeft}
      {gridRender.bottomMid}
      {gridRender.bottomRight}
    </group>
  );
};

export default React.memo(Grid);
