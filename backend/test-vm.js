const vm = require('vm');
const fs = require('fs');

const sandbox = {};
sandbox.console = console;
vm.createContext(sandbox);

sandbox.window = sandbox;

const constantsCode = fs.readFileSync('d:/DOKUMEEN/1.KULIAH IF UPNVYK 23/Semester 6/Uji Kualitas PL/Projek AKhir/payroll-systema/js/modules/constants.js', 'utf8');
vm.runInContext(constantsCode, sandbox);

const formatterCode = fs.readFileSync('d:/DOKUMEEN/1.KULIAH IF UPNVYK 23/Semester 6/Uji Kualitas PL/Projek AKhir/payroll-systema/js/utils/formatter.js', 'utf8');
vm.runInContext(formatterCode, sandbox);

const salaryCode = fs.readFileSync('d:/DOKUMEEN/1.KULIAH IF UPNVYK 23/Semester 6/Uji Kualitas PL/Projek AKhir/payroll-systema/js/modules/salary.js', 'utf8');
vm.runInContext(salaryCode, sandbox);

const testCode = `
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

  console.log("Before:", hasilBefore.gajiPokok);
  console.log("After:", hasilAfter.gajiPokok);
`;

vm.runInContext(testCode, sandbox);
