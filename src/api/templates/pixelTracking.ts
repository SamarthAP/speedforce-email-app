export const addPixelTracking: (api: string) => string = (api) => {
  return `<img src="${api}" alt="" width="1" height="1" />`;
};
