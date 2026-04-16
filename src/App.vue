<template>
  <div id="app">
    <header>
      <h1>Student Class Placement</h1>
      <p>Equitably distribute students across sections.</p>
    </header>

    <main>
      <div class="row">
        <FileUpload title="Students" @data-loaded="data => studentsData = data" />
        <FileUpload title="Classes" @data-loaded="data => classesData = data" />
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
          />
        </div>
        
        <MasterRoster v-if="results.placedStudents" :students="results.placedStudents" />
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import FileUpload from './components/FileUpload.vue';
import ClassDemographicsChart from './components/ClassDemographicsChart.vue';
import MasterRoster from './components/MasterRoster.vue';
import { runBalancer, exportToCSV } from './utils/balancer';

const studentsData = ref(null);
const classesData = ref(null);
const selectedGrade = ref("");
const errorMessage = ref("");
const results = ref(null);
const showRosters = ref(true);
const lockedStudents = ref({}); // student_number -> section_number

const availableGrades = computed(() => {
  if (!studentsData.value || !classesData.value) return [];
  const sGrades = studentsData.value.map(s => String(s.grade_level).trim()).filter(Boolean);
  const cGrades = classesData.value.map(c => String(c.grade_level).trim()).filter(Boolean);
  const unique = [...new Set([...sGrades, ...cGrades])];
  return unique.sort((a,b) => parseInt(a) - parseInt(b));
});

const handleRunClick = () => {
  errorMessage.value = "";
  results.value = null;
  try {
    results.value = runBalancer(studentsData.value, classesData.value, selectedGrade.value, lockedStudents.value);
  } catch (err) {
    errorMessage.value = err.message || "An unexpected error occurred.";
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
  }
};

const handleStudentDrop = ({ student_number, source_section, target_section }) => {
  if (!results.value) return;
  
  const sourceClass = results.value.classSummaries.find(c => c.section_number === source_section);
  const targetClass = results.value.classSummaries.find(c => c.section_number === target_section);
  
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

const downloadResults = () => {
  if (results.value && results.value.placedStudents) {
    exportToCSV(results.value.placedStudents);
  }
};
</script>

<style scoped>
header {
  margin-bottom: 2rem;
  text-align: center;
}
header h1 {
  font-size: 2.5rem;
  background: linear-gradient(to right, var(--primary), #ffffff);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  display: inline-block;
  margin-bottom: 0.5rem;
}
header p {
  color: var(--text-muted);
  font-size: 1.125rem;
}

.row {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
  margin-bottom: 2rem;
}
@media(min-width: 768px) {
  .row {
    grid-template-columns: 1fr 1fr;
  }
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
