const fs = require('fs');

// Mock browser environment
global.window = global;

// Load Constants
const constantsCode = fs.readFileSync('d:/DOKUMEEN/1.KULIAH IF UPNVYK 23/Semester 6/Uji Kualitas PL/Projek AKhir/payroll-systema/js/modules/constants.js', 'utf8');
eval(constantsCode);

// Load Salary Calculator
const salaryCode = fs.readFileSync('d:/DOKUMEEN/1.KULIAH IF UPNVYK 23/Semester 6/Uji Kualitas PL/Projek AKhir/payroll-systema/js/modules/salary.js', 'utf8');
eval(salaryCode + '\nglobal.SalaryCalculator = SalaryCalculator;');

const karyawan = {
  id: 3,
  nik: '01',
  nama: 'Nawra',
  jabatan: 'Direktur',
  departemen: 'IT',
  status: 'Tetap',
  golongan: 'V',
  ptkp: 'TK1',
};

const hasil = SalaryCalculator.hitungGajiLengkap(karyawan, 0, 0);
console.log(hasil);
