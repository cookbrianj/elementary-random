import Papa from 'papaparse';

export function runBalancer(students, classes, targetGrade, lockedMap = {}, avoidsData = null) {
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

  // Initialize classes with tracking properties
  const classStatus = gradeClasses.map(c => ({
    ...c,
    max: parseInt(c.max_students, 10) || 25,
    maxIep: (c.max_iep !== null && c.max_iep !== undefined && c.max_iep !== '') ? Number(c.max_iep) : null,
    maxMll: (c.max_mll !== null && c.max_mll !== undefined && c.max_mll !== '') ? Number(c.max_mll) : null,
    currentCount: 0,
    iepCount: 0,
    mllCount: 0,
    roster: []
  }));

  console.log(`Class Status for Grade ${targetGrade}:`, classStatus.map(c => ({
    teacher: c.teacher_name,
    section: c.section_number,
    maxIep: c.maxIep,
    maxMll: c.maxMll
  })));

  // Helper to safely check boolean-like CSV strings
  const isTrue = (val) => {
    if (val === true || val === 1) return true;
    if (!val) return false;
    const s = String(val).toLowerCase().trim();
    return s === 'true' || s === 'yes' || s === '1' || s === 'y' || s === 'iep' || s === 'mll';
  };

  // Helper to build composite class ID (course_number.section_number)
  const classId = (c) => `${String(c.course_number || '').trim()}.${String(c.section_number || '').trim()}`;

  // Pre-place locked students
  const lockedStudentNumbers = Object.keys(lockedMap);
  const remainingStudents = [];

  gradeStudents.forEach(s => {
    const sNum = String(s.student_number);
    if (lockedMap[sNum]) {
      const targetKey = String(lockedMap[sNum]);
      // Support composite key (course.section) or legacy bare section_number
      const targetClass = classStatus.find(c => classId(c) === targetKey) ||
                          classStatus.find(c => String(c.section_number) === targetKey);
      
      const hasIEP = isTrue(s.iep);
      const hasMLL = isTrue(s.mll);
      
      // Check if this lock violates any caps
      let violatesCap = false;
      if (hasIEP && targetClass && targetClass.maxIep !== null && targetClass.iepCount >= targetClass.maxIep) {
        violatesCap = true;
      }
      if (hasMLL && targetClass && targetClass.maxMll !== null && targetClass.mllCount >= targetClass.maxMll) {
        violatesCap = true;
      }
      
      if (targetClass && !violatesCap) {
        targetClass.roster.push(s);
        targetClass.currentCount++;
        if (hasIEP) targetClass.iepCount++;
        if (hasMLL) targetClass.mllCount++;
      } else {
        // Lock violates cap or class not found, treat as remaining so they can be moved
        remainingStudents.push(s);
      }
    } else {
      remainingStudents.push(s);
    }
  });

  const totalCapacity = classStatus.reduce((sum, c) => sum + parseInt(c.max_students || 0, 10), 0);
  if (gradeStudents.length > totalCapacity) {
    throw new Error(`Insufficient capacity. ${gradeStudents.length} students, but only room for ${totalCapacity}.`);
  }

  // Group remaining students
  const pools = {
    iep_mll: [],
    iep_only: [],
    mll_only: [],
    regular: []
  };

  // Build avoids map
  const avoidsMap = {};
  if (avoidsData && avoidsData.length > 0) {
    avoidsData.forEach(row => {
      const keys = Object.keys(row);
      if (keys.length >= 2) {
        const s1 = String(row[keys[0]]).trim();
        const s2 = String(row[keys[1]]).trim();
        if (s1 && s2) {
          if (!avoidsMap[s1]) avoidsMap[s1] = new Set();
          if (!avoidsMap[s2]) avoidsMap[s2] = new Set();
          avoidsMap[s1].add(s2);
          avoidsMap[s2].add(s1);
        }
      }
    });
  }

  remainingStudents.forEach(s => {
    const hasIEP = isTrue(s.iep);
    const hasMLL = isTrue(s.mll);
    
    if (hasIEP) {
      pools.iep_only.push(s);
    } else if (hasMLL) {
      pools.mll_only.push(s);
    } else {
      pools.regular.push(s);
    }
  });

  console.log(`Pools for Grade ${targetGrade}:`, {
    iep_mll: pools.iep_mll.length,
    iep_only: pools.iep_only.length,
    mll_only: pools.mll_only.length,
    regular: pools.regular.length
  });

  // Fisher-Yates shuffle for randomization
  const shuffleArray = (array) => {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  };
  
  shuffleArray(pools.iep_only);
  shuffleArray(pools.mll_only);

  // Shuffle classes internally so that distribution doesn't favor the first alphabetically
  const distributionOrder = [...classStatus];
  shuffleArray(distributionOrder);

  // Distribute function loops through sections
  let classIndex = 0;
  
  const distributePool = (pool) => {
    for (const student of pool) {
      // Find the next available class
      let placed = false;
      let attempts = 0;
      
      const studentNumStr = String(student.student_number).trim();
      const avoidSet = avoidsMap[studentNumStr];
      
      while (!placed && attempts < distributionOrder.length) {
        const currentClass = distributionOrder[classIndex];
        
        let hasAvoidConflict = false;
        if (avoidSet) {
          for (const existing of currentClass.roster) {
            if (avoidSet.has(String(existing.student_number).trim())) {
              hasAvoidConflict = true;
              break;
            }
          }
        }
        
        if (currentClass.currentCount < currentClass.max && !hasAvoidConflict) {
          const hasIEP = isTrue(student.iep);
          const hasMLL = isTrue(student.mll);

          // Check IEP cap
          if (hasIEP && currentClass.maxIep !== null && currentClass.maxIep !== undefined) {
            if (currentClass.iepCount >= currentClass.maxIep) {
              console.log(`Skipping class ${currentClass.section_number} for IEP student ${student.student_name}: iepCount=${currentClass.iepCount} >= maxIep=${currentClass.maxIep}`);
              classIndex = (classIndex + 1) % distributionOrder.length;
              attempts++;
              continue;
            }
          }
          // Check MLL cap
          if (hasMLL && currentClass.maxMll !== null && currentClass.maxMll !== undefined) {
            if (currentClass.mllCount >= currentClass.maxMll) {
              console.log(`Skipping class ${currentClass.section_number} for MLL student ${student.student_name}: mllCount=${currentClass.mllCount} >= maxMll=${currentClass.maxMll}`);
              classIndex = (classIndex + 1) % distributionOrder.length;
              attempts++;
              continue;
            }
          }
          currentClass.roster.push(student);
          currentClass.currentCount++;
          if (hasIEP) currentClass.iepCount++;
          if (hasMLL) currentClass.mllCount++;
          placed = true;
        }
        
        // Move to next class
        classIndex = (classIndex + 1) % distributionOrder.length;
        attempts++;
      }
      
      if (!placed) {
        throw new Error(`Could not place student ${student.student_name || student.name || 'Unknown'} (${student.student_number}) due to capacity or avoid conflicts.`);
      }
    }
  };

  // Distribute in priority order
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
  
  // Distribute regular students using least-filled-first strategy so that
  // classes that already received IEP/MLL students get fewer regulars,
  // keeping total counts balanced across all classes.
  const distributeRegularPool = (pool) => {
    for (const student of pool) {
      const studentNumStr = String(student.student_number).trim();
      const avoidSet = avoidsMap[studentNumStr];

      // Find eligible classes (have capacity and no avoid conflicts)
      const eligible = distributionOrder.filter(c => {
        if (c.currentCount >= c.max) return false;
        if (avoidSet) {
          for (const existing of c.roster) {
            if (avoidSet.has(String(existing.student_number).trim())) {
              return false;
            }
          }
        }
        return true;
      });

      if (eligible.length === 0) {
        throw new Error(`Could not place student ${student.student_name || student.name || 'Unknown'} (${student.student_number}) due to capacity or avoid conflicts.`);
      }

      // Sort by fill ratio (currentCount / max) to balance totals proportionally.
      // Random tie-breaking when ratios are effectively equal.
      eligible.sort((a, b) => {
        const ratioA = a.currentCount / a.max;
        const ratioB = b.currentCount / b.max;
        if (Math.abs(ratioA - ratioB) < 0.001) return Math.random() - 0.5;
        return ratioA - ratioB;
      });

      const targetClass = eligible[0];
      targetClass.roster.push(student);
      targetClass.currentCount++;
    }
  };

  distributeRegularPool(pools.regular);

  // Flatten logic for export
  const placedStudents = [];
  classStatus.forEach(c => {
    c.roster.forEach(s => {
      placedStudents.push({
        grade_level: s.grade_level,
        student_number: s.student_number,
        student_name: s.student_name || s.name || 'Unknown',
        teacher_name: c.teacher_name,
        course_number: c.course_number,
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
      course_number: c.course_number,
      section_number: c.section_number,
      grade_level: c.grade_level,
      total: c.currentCount,
      max: c.max,
      maxIep: c.maxIep,
      maxMll: c.maxMll,
      maleCount: c.roster.filter(s => String(s.gender).toLowerCase().trim() === 'm').length,
      femaleCount: c.roster.filter(s => String(s.gender).toLowerCase().trim() === 'f').length,
      iepCount: c.roster.filter(s => isTrue(s.iep)).length,
      mllCount: c.roster.filter(s => isTrue(s.mll)).length,
      classKey: classId(c),
      roster: c.roster.map(s => ({
        student_number: s.student_number,
        student_name: s.student_name || s.name || 'Unknown',
        gender: s.gender,
        iep: isTrue(s.iep),
        mll: isTrue(s.mll),
        isLocked: !!lockedMap[String(s.student_number)]
      })).sort((a, b) => a.student_name.localeCompare(b.student_name))
    }))
  };
}

export function exportToCSV(data) {
  // data should just be placedStudents
  // We explicitly want column headers: grade_level, student_name, student_number, teacher_name, section_number, iep, mll
  const mapped = data.map(row => ({
    grade_level: row.grade_level,
    student_name: row.student_name,
    student_number: row.student_number,
    teacher_name: row.teacher_name,
    section_number: row.section_number,
    iep: row.iep || '',
    mll: row.mll || ''
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
