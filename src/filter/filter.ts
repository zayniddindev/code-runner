import { restrictedKeywords } from './restrictedKeywords';

export function filter(code: string): string | undefined {
  let splitted = code.split(/[,.()'"~`!@#$%^&* \s]/);
  console.log('sp: ', splitted);
  console.log(
    'Match: ',
    splitted.find((val) => restrictedKeywords.includes(val)),
  );
  return splitted.find((val) => restrictedKeywords.includes(val));
}
