import Papa from 'papaparse';

export function runBalancer(students, classes, targetGrade) {
  // Convert targetGrade to string for comparison, but handle robustly
  const gradeStr = String(targetGrade).trim();
  
  const gradeStudents = students.filter(s => String(s.grade_level).trim() === gradeStr);
  let gradeClasses = classes.filter(c => String(c.grade_level).trim() === gradeStr);
  
  if (gradeClasses.length === 0) {
    throw new Error(`No classes found for grade level ${gradeStr}`);
  }
  if (gradeStudents.length === 0) {
    throw new Error(`No students found for grade level ${gradeStr}`);
  }

  const totalCapacity = gradeClasses.reduce((sum, c) => sum + parseInt(c.max_students || 0, 10), 0);
  if (gradeStudents.length > totalCapacity) {
    throw new Error(`Insufficient capacity. ${gradeStudents.length} students, but only room for ${totalCapacity}.`);
  }

  // Initialize classes with tracking properties
  const classStatus = gradeClasses.map(c => ({
    ...c,
    max: parseInt(c.max_students, 10),
    currentCount: 0,
    roster: []
  }));

  // Helper to safely check boolean-like CSV strings
  const isTrue = (val) => {
    if (!val) return false;
    const s = String(val).toLowerCase().trim();
    return s === 'true' || s === 'yes' || s === '1' || s === 'y';
  };

  // Group students
  const pools = {
    iep_mll: [],
    iep_only: [],
    mll_only: [],
    regular: []
  };

  gradeStudents.forEach(s => {
    const hasIEP = isTrue(s.iep);
    const hasMLL = isTrue(s.mll);
    
    if (hasIEP && hasMLL) {
      pools.iep_mll.push(s);
    } else if (hasIEP) {
      pools.iep_only.push(s);
    } else if (hasMLL) {
      pools.mll_only.push(s);
    } else {
      pools.regular.push(s);
    }
  });

  // Fisher-Yates shuffle for randomization
  const shuffleArray = (array) => {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  };
  
  shuffleArray(pools.iep_mll);
  shuffleArray(pools.iep_only);
  shuffleArray(pools.mll_only);

  // Distribute function loops through sections
  let classIndex = 0;
  
  const distributePool = (pool) => {
    for (const student of pool) {
      // Find the next available class
      let placed = false;
      let attempts = 0;
      
      while (!placed && attempts < classStatus.length) {
        const currentClass = classStatus[classIndex];
        
        if (currentClass.currentCount < currentClass.max) {
          currentClass.roster.push(student);
          currentClass.currentCount++;
          placed = true;
        }
        
        // Move to next class
        classIndex = (classIndex + 1) % classStatus.length;
        attempts++;
      }
      
      if (!placed) {
        throw new Error(`Could not place student ${student.student_name || student.name || 'Unknown'} (${student.student_number}). All sections are full.`);
      }
    }
  };

  // Distribute in priority order
  distributePool(pools.iep_mll);
  distributePool(pools.iep_only);
  distributePool(pools.mll_only);
  
  // Sort regular students by gender to help balance automatically, shuffle within gender
  pools.regular.sort((a, b) => {
    const gA = String(a.gender).toLowerCase().trim();
    const gB = String(b.gender).toLowerCase().trim();
    if (gA < gB) return -1;
    if (gA > gB) return 1;
    return Math.random() - 0.5;
  });
  
  distributePool(pools.regular);

  // Flatten logic for export
  const placedStudents = [];
  classStatus.forEach(c => {
    c.roster.forEach(s => {
      placedStudents.push({
        grade_level: s.grade_level,
        student_number: s.student_number,
        student_name: s.student_name || s.name || 'Unknown',
        teacher_name: c.teacher_name,
        section_number: c.section_number,
        iep: s.iep,
        mll: s.mll,
        gender: s.gender
      });
    });
  });

  return {
    placedStudents,
    classSummaries: classStatus.map(c => ({
      teacher_name: c.teacher_name,
      section_number: c.section_number,
      total: c.currentCount,
      max: c.max,
      maleCount: c.roster.filter(s => String(s.gender).toLowerCase().trim() === 'm').length,
      femaleCount: c.roster.filter(s => String(s.gender).toLowerCase().trim() === 'f').length,
      iepCount: c.roster.filter(s => isTrue(s.iep)).length,
      mllCount: c.roster.filter(s => isTrue(s.mll)).length,
      roster: c.roster.map(s => ({
        student_number: s.student_number,
        student_name: s.student_name || s.name || 'Unknown',
        gender: s.gender,
        iep: isTrue(s.iep),
        mll: isTrue(s.mll)
      })).sort((a, b) => a.student_name.localeCompare(b.student_name))
    }))
  };
}

export function exportToCSV(data) {
  // data should just be placedStudents
  // We explicitly want column headers: grade_level, student_number, teacher_name, section_number
  const mapped = data.map(row => ({
    grade_level: row.grade_level,
    student_number: row.student_number,
    teacher_name: row.teacher_name,
    section_number: row.section_number
  }));
  
  const csv = Papa.unparse(mapped);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', 'placed_students.csv');
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
