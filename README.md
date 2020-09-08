# Infinite Image Gallery with `react-three-fiber`

[![Netlify Status](https://api.netlify.com/api/v1/badges/0354da48-43b4-4ef6-bb25-35a695d25763/deploy-status)](https://app.netlify.com/sites/nnl-infinite-image-gallery/deploys)

[View Deployment](https://nnl-infinite-image-gallery.netlify.app/)

---

This is a reimplementation of the infinite image gallery on [Bien Joué](https://bien-joue.ca/fr/) with `react-three-fiber`. Performance issues are still around but in general the core logic of an infinite gallery is achieved. It was a really interesting problem.

## How to run

```
yarn
yarn start
```

or

```
npm install
npm start
```

## A few words

### Two core problems I solved in this project:

1. How to build an infinite image gallery:
   - Render multiple duplicate grids that surround the center, original grid (I ended up with 3x3 = 9 grids). Keep track of which grid is in center and which are the boundaries
   - Detecting the visibility of each boundary grid, depending on current camera position
   - Under certain conditions (boundary reached), update the grids' position & update the grids' position tracker. E.g.: Top boundary reached, move the whole bottom 3 grids up top. Now the first row becomes the middle row, and the center row becomes the bottom row...
2. Update vertex shader on `mousemove`, calculating mouse's offset distance to current camera's position & update image distortion effect.

### Major issues I'm awared of and haven't been able to solve:

- Performance. Rendering multiple meshes at the same time is heavy. I'm still looking for a way to optimize this

## Dependencies

- `three.js`
- `react` and `react-three-fiber`
- `react-spring`
- `zustand`
- GLSL (shaders)
