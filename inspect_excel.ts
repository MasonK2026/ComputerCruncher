import { readFile, utils } from 'xlsx';
import { join } from 'path';

const file = readFile(join(process.cwd(), '19AT Upload Test.xlsx'));
const sheet = file.Sheets[file.SheetNames[0]];
const data = utils.sheet_to_json(sheet, { header: 1 });
console.log('Headers:', data[0]);
console.log('First Row:', data[1]);
