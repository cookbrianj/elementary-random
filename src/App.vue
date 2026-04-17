<template>
  <div id="app">
    <header>
      <div class="header-content">
        <div>
          <h1>Student Class Placement</h1>
          <p>Equitably distribute students across sections.</p>
        </div>
        <nav class="main-nav">
          <button @click="currentView = 'dashboard'" :class="{ 'active': currentView === 'dashboard' }">Dashboard</button>
          <button @click="currentView = 'help'" :class="{ 'active': currentView === 'help' }">Help</button>
        </nav>
      </div>
    </header>

    <main v-if="currentView === 'help'">
      <HelpView @back="currentView = 'dashboard'" />
    </main>

    <main v-else>
      <div class="row">
        <FileUpload title="Students" @data-loaded="data => studentsData = data" />
        <FileUpload title="Classes" @data-loaded="data => classesData = data" />
        <div class="card resume-card">
          <h3>Resume Session</h3>
          <p>Load a previously saved .json project file.</p>
          <div class="resume-controls">
            <input type="file" id="resumeUpload" @change="handleProjectUpload" accept=".json" style="display: none" />
            <label for="resumeUpload" class="scenario-upload-btn">Upload Saved Scenario</label>
          </div>
        </div>
        <AddTeacherForm @add-teacher="handleAddTeacher" />
      </div>

      <div class="card control-panel" v-if="studentsData && classesData">
        <div class="controls">
          <div>
            <label for="gradeSelect">Select Grade Level</label>
            <select id="gradeSelect" v-model="selectedGrade">
              <option disabled value="">Please select one</option>
              <option v-for="grade in availableGrades" :key="grade" :value="grade">Grade {{ grade }}</option>
            </select>
          </div>
          <button @click="handleRunClick" :disabled="!selectedGrade">Balance Classes</button>
        </div>
        <div v-if="errorMessage" class="error-box">
          {{ errorMessage }}
        </div>
      </div>

      <div v-if="results" class="results-dashboard">
        <div class="results-header">
          <h2>Placement Results</h2>
          <div style="display: flex; gap: 1rem;">
            <button @click="showRosters = !showRosters" class="secondary">
              {{ showRosters ? 'Hide Rosters' : 'Show Rosters' }}
            </button>
            <button @click="saveProject" class="secondary save-btn">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 0.5rem;"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>
              Save Scenario
            </button>
            <button @click="downloadResults" class="secondary">
               <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 0.5rem;"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
              Download CSV
            </button>
          </div>
        </div>
        <div class="charts-grid">
          <ClassDemographicsChart 
            v-for="summary in results.classSummaries" 
            :key="summary.section_number" 
            :summary="summary" 
            :show-roster="showRosters"
            @drop-student="handleStudentDrop"
            @update-max="handleUpdateMax"
            @toggle-lock="handleToggleLock"
            @delete-section="handleDeleteSection"
          />
        </div>
        
        <MasterRoster 
          v-if="results.placedStudents" 
          :students="results.placedStudents" 
          :sections="results.classSummaries"
          @toggle-lock="handleToggleLock" 
          @move-student="handleStudentDrop"
        />
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import FileUpload from './components/FileUpload.vue';
import AddTeacherForm from './components/AddTeacherForm.vue';
import HelpView from './components/HelpView.vue';
import ClassDemographicsChart from './components/ClassDemographicsChart.vue';
import MasterRoster from './components/MasterRoster.vue';
import { runBalancer, exportToCSV } from './utils/balancer';

const currentView = ref('dashboard');
const studentsData = ref(null);
const classesData = ref(null);
const selectedGrade = ref("");
const errorMessage = ref("");
const results = ref(null);
const showRosters = ref(true);
const lockedStudents = ref({}); // student_number -> section_number
const allResultsByGrade = ref({}); // { '2': balancerResults, '3': ... }

// Clear all results when raw data changes
watch([studentsData, classesData], () => {
  allResultsByGrade.value = {};
  results.value = null;
});

// Switch results when grade level changes
watch(selectedGrade, (newGrade) => {
  results.value = allResultsByGrade.value[newGrade] || null;
});

const availableGrades = computed(() => {
  if (!studentsData.value || !classesData.value) return [];
  const sGrades = studentsData.value.map(s => String(s.grade_level).trim()).filter(Boolean);
  const cGrades = classesData.value.map(c => String(c.grade_level).trim()).filter(Boolean);
  const unique = [...new Set([...sGrades, ...cGrades])];
  return unique.sort((a,b) => parseInt(a) - parseInt(b));
});

const handleRunClick = () => {
  errorMessage.value = "";
  try {
    const balancerResults = runBalancer(studentsData.value, classesData.value, selectedGrade.value, lockedStudents.value);
    // Sort class summaries alphabetically by teacher name
    balancerResults.classSummaries.sort((a, b) => a.teacher_name.localeCompare(b.teacher_name));
    
    // Save to both current view and the persistent store
    results.value = balancerResults;
    allResultsByGrade.value[selectedGrade.value] = balancerResults;
  } catch (err) {
    errorMessage.value = err.message || "An unexpected error occurred.";
  }
};

const handleAddTeacher = (teacherInfo) => {
  if (!classesData.value) {
    classesData.value = [];
  }
  
  const existingSections = classesData.value.map(c => String(c.section_number));
  if (existingSections.includes(String(teacherInfo.section_number))) {
    errorMessage.value = `Section number ${teacherInfo.section_number} already exists.`;
    return;
  }

  const newClass = {
    teacher_name: teacherInfo.teacher_name,
    grade_level: String(teacherInfo.grade_level),
    course_number: String(teacherInfo.course_number),
    max_students: String(teacherInfo.max_students),
    section_number: String(teacherInfo.section_number)
  };
  
  classesData.value.push(newClass);

  // If we are currently looking at this grade, add it to the active results too
  if (results.value && String(teacherInfo.grade_level) === String(selectedGrade.value)) {
    results.value.classSummaries.push({
      teacher_name: newClass.teacher_name,
      course_number: newClass.course_number,
      section_number: newClass.section_number,
      grade_level: newClass.grade_level,
      max: parseInt(newClass.max_students),
      total: 0,
      maleCount: 0,
      femaleCount: 0,
      iepCount: 0,
      mllCount: 0,
      roster: []
    });
    // Optional: sort cards by teacher name
    results.value.classSummaries.sort((a,b) => a.teacher_name.localeCompare(b.teacher_name));
  }
};

const handleToggleLock = ({ student_number, section_number }) => {
  const sNum = String(student_number);
  if (lockedStudents.value[sNum]) {
    delete lockedStudents.value[sNum];
  } else {
    lockedStudents.value[sNum] = String(section_number);
  }
  
  // Update the local results state to reflect the UI change immediately
  if (results.value) {
    const section = results.value.classSummaries.find(c => String(c.section_number) === String(section_number));
    if (section) {
      const student = section.roster.find(s => String(s.student_number) === sNum);
      if (student) {
        student.isLocked = !!lockedStudents.value[sNum];
      }
    }

    const masterStudent = results.value.placedStudents.find(s => String(s.student_number) === sNum);
    if (masterStudent) {
      masterStudent.isLocked = !!lockedStudents.value[sNum];
    }
  }
};

const handleStudentDrop = ({ student_number, source_section, target_section }) => {
  if (!results.value) return;
  
  const sourceClass = results.value.classSummaries.find(c => String(c.section_number) === String(source_section));
  const targetClass = results.value.classSummaries.find(c => String(c.section_number) === String(target_section));
  
  if (!sourceClass || !targetClass) return;
  
  const studentIndex = sourceClass.roster.findIndex(s => s.student_number === student_number);
  if (studentIndex === -1) return;
  
  const [student] = sourceClass.roster.splice(studentIndex, 1);
  targetClass.roster.push(student);
  targetClass.roster.sort((a, b) => a.student_name.localeCompare(b.student_name));
  
  // If the student was already locked, update their lock destination
  if (lockedStudents.value[String(student_number)]) {
    lockedStudents.value[String(student_number)] = String(target_section);
  }
  
  sourceClass.total = sourceClass.roster.length;
  sourceClass.maleCount = sourceClass.roster.filter(s => String(s.gender).toLowerCase().trim() === 'm').length;
  sourceClass.femaleCount = sourceClass.roster.filter(s => String(s.gender).toLowerCase().trim() === 'f').length;
  sourceClass.iepCount = sourceClass.roster.filter(s => s.iep).length;
  sourceClass.mllCount = sourceClass.roster.filter(s => s.mll).length;
  
  targetClass.total = targetClass.roster.length;
  targetClass.maleCount = targetClass.roster.filter(s => String(s.gender).toLowerCase().trim() === 'm').length;
  targetClass.femaleCount = targetClass.roster.filter(s => String(s.gender).toLowerCase().trim() === 'f').length;
  targetClass.iepCount = targetClass.roster.filter(s => s.iep).length;
  targetClass.mllCount = targetClass.roster.filter(s => s.mll).length;

  const placedIndex = results.value.placedStudents.findIndex(s => String(s.student_number) === String(student_number));
  if (placedIndex !== -1) {
    results.value.placedStudents[placedIndex].section_number = targetClass.section_number;
    results.value.placedStudents[placedIndex].teacher_name = targetClass.teacher_name;
  }
};

const handleUpdateMax = ({ section_number, newMax }) => {
  if (!results.value) return;
  const summary = results.value.classSummaries.find(c => c.section_number === section_number);
  if (summary) {
    summary.max = newMax;
  }
  
  if (classesData.value) {
    const originalClass = classesData.value.find(c => String(c.section_number) === String(section_number));
    if (originalClass) {
      originalClass.max_students = String(newMax);
    }
  }
};

const handleDeleteSection = (section_number) => {
  if (!classesData.value) return;
  
  const targetClass = classesData.value.find(c => String(c.section_number) === String(section_number));
  if (!targetClass) return;

  const confirmed = window.confirm(
    `Are you sure you want to delete the section for ${targetClass.teacher_name}? \n\nThis will remove the classroom and re-run the 'Balance Classes' function to redistribute all students across the remaining rooms.`
  );

  if (!confirmed) return;

  // 1. Remove from classesData
  classesData.value = classesData.value.filter(c => String(c.section_number) !== String(section_number));

  // 2. Remove any locks associated with this section
  Object.keys(lockedStudents.value).forEach(studentNum => {
    if (String(lockedStudents.value[studentNum]) === String(section_number)) {
      delete lockedStudents.value[studentNum];
    }
  });

  // 3. Re-run balancer if results are currently shown
  if (results.value) {
    handleRunClick();
  }
};

const downloadResults = () => {
  if (results.value && results.value.placedStudents) {
    exportToCSV(results.value.placedStudents);
  }
};

const saveProject = () => {
  const scenarioName = window.prompt("Enter a name for this placement scenario:", `Grade ${selectedGrade.value || ''} - ${new Date().toLocaleDateString()}`);
  
  if (scenarioName === null) return; // User cancelled
  
  const projectData = {
    scenarioName: scenarioName,
    studentsData: studentsData.value,
    classesData: classesData.value,
    selectedGrade: selectedGrade.value,
    lockedStudents: lockedStudents.value,
    allResultsByGrade: allResultsByGrade.value,
    results: results.value, // for immediate backward compatibility
    version: "1.1",
    savedAt: new Date().toISOString()
  };
  
  const blob = new Blob([JSON.stringify(projectData, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  
  // Format filename: replace spaces/special chars with underscores
  const safeName = scenarioName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  link.download = `scenario_${safeName}.json`;
  link.click();
  URL.revokeObjectURL(url);
};

const handleProjectUpload = (event) => {
  const file = event.target.files[0];
  if (!file) return;
  
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result);
      if (data.studentsData) studentsData.value = data.studentsData;
      if (data.classesData) classesData.value = data.classesData;
      if (data.selectedGrade) selectedGrade.value = data.selectedGrade;
      if (data.lockedStudents) lockedStudents.value = data.lockedStudents;
      if (data.allResultsByGrade) {
        allResultsByGrade.value = data.allResultsByGrade;
        results.value = data.allResultsByGrade[selectedGrade.value] || null;
      } else if (data.results) {
        // Handle legacy scenario files
        results.value = data.results;
        allResultsByGrade.value[selectedGrade.value] = data.results;
      }
      
      errorMessage.value = "";
    } catch (err) {
      errorMessage.value = "Failed to load project file. Please ensure it is a valid .json project.";
    }
  };
  reader.readAsText(file);
};

// Auto-save logic
watch([studentsData, classesData, selectedGrade, lockedStudents, results, allResultsByGrade], () => {
  const projectData = {
    studentsData: studentsData.value,
    classesData: classesData.value,
    selectedGrade: selectedGrade.value,
    lockedStudents: lockedStudents.value,
    allResultsByGrade: allResultsByGrade.value,
    results: results.value
  };
  localStorage.setItem('nsd_placement_autosave', JSON.stringify(projectData));
}, { deep: true });

onMounted(() => {
  const saved = localStorage.getItem('nsd_placement_autosave');
  if (saved) {
    try {
      const data = JSON.parse(saved);
      if (data.studentsData) studentsData.value = data.studentsData;
      if (data.classesData) classesData.value = data.classesData;
      if (data.selectedGrade) selectedGrade.value = data.selectedGrade;
      if (data.lockedStudents) lockedStudents.value = data.lockedStudents;
      if (data.allResultsByGrade) {
        allResultsByGrade.value = data.allResultsByGrade;
        results.value = data.allResultsByGrade[selectedGrade.value] || null;
      } else if (data.results) {
        results.value = data.results;
        allResultsByGrade.value[selectedGrade.value] = data.results;
      }
    } catch (e) {
      console.error("Failed to restore autosave", e);
    }
  }
});
</script>

<style scoped>
header {
  margin-bottom: 2rem;
  border-bottom: 1px solid var(--surface-border);
  padding-bottom: 2rem;
}
.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
@media (max-width: 640px) {
  .header-content {
    flex-direction: column;
    text-align: center;
    gap: 1.5rem;
  }
}
header h1 {
  font-size: 2.25rem;
  background: linear-gradient(to right, var(--primary), #ffffff);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  display: inline-block;
  margin-bottom: 0.25rem;
}
header p {
  color: var(--text-muted);
  font-size: 1rem;
}

.main-nav {
  display: flex;
  gap: 0.5rem;
  background-color: var(--card-bg);
  padding: 0.375rem;
  border-radius: var(--radius-md);
  border: 1px solid var(--surface-border);
}
.main-nav button {
  background: transparent;
  border: none;
  font-size: 0.875rem;
  padding: 0.5rem 1.25rem;
  color: var(--text-muted);
  border-radius: var(--radius-sm);
  transition: all 0.2s ease;
}
.main-nav button:hover {
  color: var(--text-active);
}
.main-nav button.active {
  background-color: var(--primary);
  color: var(--bg-color);
  font-weight: 600;
}

.row {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
  margin-bottom: 2rem;
}
@media(min-width: 992px) {
  .row {
    grid-template-columns: 1fr 1fr;
  }
}
@media(min-width: 1200px) {
  .row {
    grid-template-columns: repeat(4, 1fr);
  }
}

.resume-card {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
  border-style: dashed;
}
.resume-card h3 {
  margin-top: 0;
  color: var(--primary);
}
.resume-card p {
  font-size: 0.825rem;
  color: var(--text-muted);
  margin-bottom: 2rem;
}

.scenario-upload-btn {
  background-color: transparent;
  border: 2px solid var(--primary);
  color: var(--primary);
  padding: 0.75rem 1.5rem;
  border-radius: var(--radius-sm);
  font-weight: 600;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s ease;
  display: inline-block;
  text-transform: uppercase;
  letter-spacing: 0.025em;
  box-shadow: 0 4px 12px rgba(197, 179, 88, 0.1);
}

.scenario-upload-btn:hover {
  background-color: var(--primary);
  color: var(--bg-color);
  box-shadow: 0 6px 16px rgba(197, 179, 88, 0.2);
  transform: translateY(-1px);
}

.scenario-upload-btn:active {
  transform: translateY(0);
}

.control-panel {
  margin-bottom: 2rem;
}
.controls {
  display: flex;
  align-items: flex-end;
  gap: 1.5rem;
}
.controls > div {
  flex: 1;
}
.controls select {
  width: 100%;
}

.error-box {
  margin-top: 1rem;
  padding: 1rem;
  background-color: rgba(225, 29, 72, 0.1);
  color: #fb7185;
  border: 1px solid rgba(225, 29, 72, 0.4);
  border-radius: var(--radius-sm);
}

.results-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--surface-border);
}

.charts-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
}
@media(min-width: 768px) {
  .charts-grid {
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  }
}
</style>
