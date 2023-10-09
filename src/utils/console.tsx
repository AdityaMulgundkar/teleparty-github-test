export const logger = (input: any) => {
  if (process.env.NODE_ENV !== "production") return console.log(input);
};
