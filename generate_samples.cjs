const fs = require('fs');

const students = [
  "student_number,student_name,grade_level,gender,iep,mll"
];

for(let i=1; i<=100; i++) {
  const g = i % 2 === 0 ? 1 : 2;
  const isIEP = Math.random() > 0.8;
  const isMLL = Math.random() > 0.8;
  const gender = Math.random() > 0.5 ? 'm' : 'f';
  students.push(`${1000 + i},Student ${i},${g},${gender},${isIEP},${isMLL}`);
}

fs.writeFileSync('students.csv', students.join('\n'));

const classes = [
  "teacher_name,section_number,grade_level,max_students",
  "Mr. Smith,101,1,26",
  "Ms. Davis,102,1,28",
  "Mrs. Taylor,201,2,25",
  "Mr. Brown,202,2,30"
];

fs.writeFileSync('classes.csv', classes.join('\n'));
console.log("Created students.csv and classes.csv");
