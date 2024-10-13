export const extractColumnHeaderAndData = (records) => {
  const [header, ...data] = records;

  return [header, data]
}