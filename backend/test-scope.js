const fs = require('fs');
global.window = global;

// Mock DOM
global.document = {
  getElementById: (id) => {
    return { value: '10' }; // simulate 10%
  }
};

const constantsCode = fs.readFileSync('d:/DOKUMEEN/1.KULIAH IF UPNVYK 23/Semester 6/Uji Kualitas PL/Projek AKhir/payroll-systema/js/modules/constants.js', 'utf8');
// Evaluate constants.js
eval(constantsCode);

const formatterCode = fs.readFileSync('d:/DOKUMEEN/1.KULIAH IF UPNVYK 23/Semester 6/Uji Kualitas PL/Projek AKhir/payroll-systema/js/utils/formatter.js', 'utf8');
eval(formatterCode + '\n global.Formatter = Formatter;');

const salaryCode = fs.readFileSync('d:/DOKUMEEN/1.KULIAH IF UPNVYK 23/Semester 6/Uji Kualitas PL/Projek AKhir/payroll-systema/js/modules/salary.js', 'utf8');
eval(salaryCode + '\n global.SalaryCalculator = SalaryCalculator;');

const scenarioCode = fs.readFileSync('d:/DOKUMEEN/1.KULIAH IF UPNVYK 23/Semester 6/Uji Kualitas PL/Projek AKhir/payroll-systema/js/modules/scenario.js', 'utf8');
eval(scenarioCode + '\n global.ScenarioModule = ScenarioModule;');

const karyawanList = [{
  id: '01',
  nama: 'Nawra',
  jabatan: 'Direktur',
  departemen: 'IT',
  status: 'Tetap',
  golongan: 'V',
  ptkp: 'TK1'
}];

const params = {
  kenaikanGajiPersen: 0.1,
  kenaikanBpjsPersen: 0,
  kenaikanMakanRp: 0,
  kenaikanTransportRp: 0,
  tambahanLembur: 0
};

// Expose the private function for testing using eval hacking, or just duplicate it
const tempConstants = {
  ...CONSTANTS,
  GAJI_POKOK:        { ...CONSTANTS.GAJI_POKOK },
  MULTIPLIER_STATUS: { ...CONSTANTS.MULTIPLIER_STATUS },
};
for (const golongan in tempConstants.GAJI_POKOK) {
  tempConstants.GAJI_POKOK[golongan] = Math.round(
    CONSTANTS.GAJI_POKOK[golongan] * (1 + params.kenaikanGajiPersen)
  );
}

const originalConstants = window.CONSTANTS;
window.CONSTANTS = tempConstants;
const hasilAfter = SalaryCalculator.hitungGajiLengkap(karyawanList[0], 0, 0);
window.CONSTANTS = originalConstants;
const hasilBefore = SalaryCalculator.hitungGajiLengkap(karyawanList[0], 0, 0);

console.log("Before: ", hasilBefore.gajiPokok);
console.log("After: ", hasilAfter.gajiPokok);
