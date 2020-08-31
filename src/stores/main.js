import create from "zustand";

const [useMainStore] = create((set, get) => ({
  data: [],
  dataLoaded: false,
  loadData: async () => {
    let data = [];

    for (let i = 0; i < 30; i++) {
      const image = await fetch(
        `https://picsum.photos/seed/${i}/1024/1024`
      ).then((res) => res.url);

      data.push({
        label: `Image ${i + 1}`,
        image,
      });
    }

    set({ data, dataLoaded: true });
  },

  gridNeedsUpdate: false,
  setGridNeedsUpdate: (gridNeedsUpdate) => set({ gridNeedsUpdate }),
}));

export default useMainStore;
