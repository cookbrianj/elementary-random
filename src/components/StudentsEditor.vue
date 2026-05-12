<template>
  <div class="students-editor">
    <aside class="editor-sidebar">
      <button @click="$emit('back')" class="back-btn">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 0.5rem;"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
        Back to Dashboard
      </button>
      
      <div class="card form-card">
        <h3>{{ isEditing ? 'Edit Student' : 'Add Student' }}</h3>
        
        <form @submit.prevent="saveStudent">
          <div class="form-group">
            <label>Student Number (ID)</label>
            <input type="text" v-model="form.student_number" required :disabled="isEditing" placeholder="e.g. 123456" />
          </div>
          
          <div class="form-group">
            <label>Student Name</label>
            <input type="text" v-model="form.student_name" required placeholder="Last, First" />
          </div>
          
          <div class="form-group">
            <label>Grade Level</label>
            <input type="text" v-model="form.grade_level" required placeholder="e.g. 1" />
          </div>
          
          <div class="form-row">
            <div class="form-group half">
              <label>Gender</label>
              <select v-model="form.gender">
                <option value="M">M</option>
                <option value="F">F</option>
                <option value="">None</option>
              </select>
            </div>
            
            <div class="form-group half">
              <label>IEP</label>
              <select v-model="form.iep">
                <option value="Y">Yes</option>
                <option value="N">No</option>
              </select>
            </div>
          </div>
          
          <div class="form-row">
            <div class="form-group half">
              <label>MLL</label>
              <select v-model="form.mll">
                <option value="Y">Yes</option>
                <option value="N">No</option>
              </select>
            </div>
          </div>
          
          <div v-if="errorMsg" class="error-msg">{{ errorMsg }}</div>
          
          <div class="form-actions">
            <button type="button" v-if="isEditing" @click="resetForm" class="secondary">Cancel</button>
            <button type="submit" class="primary" style="flex: 1;">
              {{ isEditing ? 'Save Changes' : 'Add Student' }}
            </button>
          </div>
        </form>
      </div>
    </aside>

    <main class="editor-main">
      <div class="card list-card">
        <div class="list-header">
          <h2>Student Roster</h2>
          <div class="list-controls">
            <input type="text" v-model="searchQuery" placeholder="Search by name or ID..." class="search-input" />
            <select v-model="gradeFilter" class="grade-filter">
              <option value="">All Grades</option>
              <option v-for="g in availableGrades" :key="g" :value="g">Grade {{ g }}</option>
            </select>
            <span class="count-badge">{{ filteredStudents.length }} students</span>
          </div>
        </div>
        
        <div class="table-container">
          <table v-if="filteredStudents.length > 0">
            <thead>
              <tr>
                <th>Name</th>
                <th>ID</th>
                <th>Grade</th>
                <th>Details</th>
                <th style="width: 100px; text-align: right;">Action</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(student, index) in filteredStudents" :key="student.student_number || index">
                <td>
                  <strong>{{ student.student_name }}</strong>
                </td>
                <td class="text-muted">{{ student.student_number }}</td>
                <td>{{ student.grade_level }}</td>
                <td>
                  <div class="tags">
                    <span v-if="isTrue(student.iep)" class="tag iep">IEP</span>
                    <span v-if="isTrue(student.mll)" class="tag mll">MLL</span>
                    <span v-if="student.gender" class="tag default">{{ student.gender }}</span>
                  </div>
                </td>
                <td style="text-align: right;">
                  <button @click="editStudent(student)" class="icon-btn edit-btn" title="Edit student">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                  </button>
                  <button @click="deleteStudent(student)" class="icon-btn remove-btn" title="Remove student">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
          
          <div v-else class="empty-state">
            <div class="icon-box" style="margin: 0 auto 1rem; width: 64px; height: 64px; font-size: 2rem;">🔍</div>
            <h3>No Students Found</h3>
            <p>Try adjusting your search or filters.</p>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';

const props = defineProps({
  studentsData: {
    type: Array,
    default: () => []
  }
});

const emit = defineEmits(['update-students', 'back']);

const searchQuery = ref("");
const gradeFilter = ref("");
const errorMsg = ref("");
const isEditing = ref(false);

const form = ref({
  student_number: '',
  student_name: '',
  grade_level: '',
  gender: '',
  iep: 'N',
  mll: 'N'
});

const isTrue = (val) => {
  if (val === true || val === 1) return true;
  if (!val) return false;
  const s = String(val).toLowerCase().trim();
  return s === 'true' || s === 'yes' || s === '1' || s === 'y' || s === 'iep' || s === 'mll';
};

const safeData = computed(() => Array.isArray(props.studentsData) ? props.studentsData : []);

const availableGrades = computed(() => {
  const grades = safeData.value.map(s => String(s.grade_level || '').trim()).filter(Boolean);
  const unique = [...new Set(grades)];
  return unique.sort((a, b) => parseInt(a) - parseInt(b));
});

const filteredStudents = computed(() => {
  let list = safeData.value.filter(s => {
    return String(s.student_number || '').trim() !== '' &&
           String(s.student_name || '').trim() !== '' &&
           String(s.grade_level || '').trim() !== '';
  });
  
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase().trim();
    list = list.filter(s => 
      String(s.student_name || '').toLowerCase().includes(q) ||
      String(s.student_number || '').toLowerCase().includes(q)
    );
  }
  
  if (gradeFilter.value) {
    list = list.filter(s => String(s.grade_level || '').trim() === String(gradeFilter.value));
  }
  
  return [...list].sort((a, b) => {
    const nameA = String(a.student_name || '').toLowerCase();
    const nameB = String(b.student_name || '').toLowerCase();
    return nameA.localeCompare(nameB);
  });
});

const resetForm = () => {
  form.value = {
    student_number: '',
    student_name: '',
    grade_level: '',
    gender: '',
    iep: 'N',
    mll: 'N'
  };
  isEditing.value = false;
  errorMsg.value = "";
};

const editStudent = (student) => {
  form.value = {
    student_number: String(student.student_number || ''),
    student_name: String(student.student_name || ''),
    grade_level: String(student.grade_level || ''),
    gender: String(student.gender || ''),
    iep: isTrue(student.iep) ? 'Y' : 'N',
    mll: isTrue(student.mll) ? 'Y' : 'N'
  };
  isEditing.value = true;
  errorMsg.value = "";
};

const deleteStudent = (student) => {
  if (confirm(`Are you sure you want to delete ${student.student_name}?`)) {
    const newData = safeData.value.filter(s => String(s.student_number) !== String(student.student_number));
    emit('update-students', newData);
    
    // If we were editing this student, reset the form
    if (isEditing.value && String(form.value.student_number) === String(student.student_number)) {
      resetForm();
    }
  }
};

const saveStudent = () => {
  errorMsg.value = "";
  
  const sNum = String(form.value.student_number).trim();
  const sName = String(form.value.student_name).trim();
  const sGrade = String(form.value.grade_level).trim();
  
  if (!sNum || !sName || !sGrade) {
    errorMsg.value = "Student Number, Name, and Grade are required.";
    return;
  }
  
  const newData = [...safeData.value];
  
  if (isEditing.value) {
    const index = newData.findIndex(s => String(s.student_number) === sNum);
    if (index !== -1) {
      // Preserve other fields that might be attached to the student
      newData[index] = {
        ...newData[index],
        student_name: sName,
        grade_level: sGrade,
        gender: form.value.gender,
        iep: form.value.iep,
        mll: form.value.mll
      };
    }
  } else {
    // Check for duplicate ID
    if (newData.some(s => String(s.student_number) === sNum)) {
      errorMsg.value = "A student with this ID already exists.";
      return;
    }
    
    newData.push({
      student_number: sNum,
      student_name: sName,
      grade_level: sGrade,
      gender: form.value.gender,
      iep: form.value.iep,
      mll: form.value.mll
    });
  }
  
  emit('update-students', newData);
  resetForm();
};
</script>

<style scoped>
/* Inherit standard layout styles similar to AvoidsEditor */
.students-editor {
  display: grid;
  grid-template-columns: 320px 1fr;
  gap: 2rem;
  max-width: 1400px;
  margin: 0 auto;
}

@media (max-width: 992px) {
  .students-editor {
    grid-template-columns: 1fr;
  }
}

.editor-sidebar {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.back-btn {
  width: 100%;
  justify-content: center;
}

.form-card {
  padding: 1.5rem;
}

.form-card h3 {
  margin-top: 0;
  margin-bottom: 1.5rem;
  color: var(--primary);
}

.form-group {
  margin-bottom: 1rem;
}

.form-row {
  display: flex;
  gap: 1rem;
}

.form-group.half {
  flex: 1;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-active);
}

.form-group input,
.form-group select {
  width: 100%;
  padding: 0.75rem;
  background-color: rgba(15, 23, 42, 0.5);
  border: 1px solid var(--surface-border);
  border-radius: var(--radius-sm);
  color: var(--text-active);
  font-family: var(--font-sans);
}

.form-group input:focus,
.form-group select:focus {
  border-color: var(--primary);
  outline: none;
  box-shadow: 0 0 0 3px rgba(197, 179, 88, 0.15);
}

.form-group input:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background-color: rgba(0, 0, 0, 0.2);
}

.form-actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 1.5rem;
}

.error-msg {
  color: #fb7185;
  font-size: 0.875rem;
  margin-top: 0.5rem;
  padding: 0.5rem;
  background-color: rgba(225, 29, 72, 0.1);
  border-radius: 4px;
}

.list-card {
  padding: 0;
  overflow: hidden;
}

.list-header {
  padding: 1.5rem;
  border-bottom: 1px solid var(--surface-border);
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: rgba(255, 255, 255, 0.02);
  flex-wrap: wrap;
  gap: 1rem;
}

.list-header h2 {
  margin: 0;
  font-size: 1.25rem;
}

.list-controls {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.search-input {
  padding: 0.5rem 1rem;
  background-color: rgba(15, 23, 42, 0.5);
  border: 1px solid var(--surface-border);
  border-radius: var(--radius-sm);
  color: var(--text-active);
  min-width: 200px;
}

.grade-filter {
  padding: 0.5rem;
  background-color: rgba(15, 23, 42, 0.5);
  border: 1px solid var(--surface-border);
  border-radius: var(--radius-sm);
  color: var(--text-active);
}

.count-badge {
  background-color: var(--surface-border);
  color: var(--text-muted);
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 500;
}

.table-container {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th {
  text-align: left;
  padding: 1rem 1.5rem;
  background-color: rgba(255, 255, 255, 0.02);
  color: var(--text-muted);
  font-weight: 500;
  font-size: 0.875rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-bottom: 1px solid var(--surface-border);
}

td {
  padding: 1rem 1.5rem;
  border-bottom: 1px solid var(--surface-border);
}

tr:last-child td {
  border-bottom: none;
}

.tags {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.tag {
  font-size: 0.7rem;
  padding: 0.2rem 0.4rem;
  border-radius: 3px;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.tag.iep {
  background-color: rgba(56, 189, 248, 0.15);
  color: #38bdf8;
}

.tag.mll {
  background-color: rgba(244, 114, 182, 0.15);
  color: #f472b6;
}

.tag.default {
  background-color: var(--surface-border);
  color: var(--text-muted);
}

.icon-btn {
  background: transparent;
  border: 1px solid transparent;
  padding: 0.5rem;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all 0.2s ease;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.edit-btn {
  color: var(--text-muted);
}
.edit-btn:hover {
  color: var(--text-active);
  background-color: rgba(255, 255, 255, 0.05);
}

.remove-btn {
  color: var(--text-muted);
}
.remove-btn:hover {
  color: #fb7185;
  background-color: rgba(225, 29, 72, 0.1);
  border-color: rgba(225, 29, 72, 0.2);
}

.empty-state {
  padding: 4rem 2rem;
  text-align: center;
  color: var(--text-muted);
}

.empty-state h3 {
  color: var(--text-active);
  margin-bottom: 0.5rem;
}
</style>
