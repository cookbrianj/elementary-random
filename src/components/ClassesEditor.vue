<template>
  <div class="classes-editor">
    <aside class="editor-sidebar">
      <button @click="$emit('back')" class="back-btn">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 0.5rem;"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
        Back to Dashboard
      </button>
      
      <div class="card form-card">
        <h3>{{ isEditing ? 'Edit Class' : 'Add Class' }}</h3>
        
        <form @submit.prevent="saveClass">
          <div class="form-group">
            <label>Section Number (ID)</label>
            <input type="text" v-model="form.section_number" required :disabled="isEditing" placeholder="e.g. 201" />
          </div>
          
          <div class="form-group">
            <label>Teacher Name</label>
            <input type="text" v-model="form.teacher_name" required placeholder="Last, First" />
          </div>
          
          <div class="form-group">
            <label>Course Number</label>
            <input type="text" v-model="form.course_number" required placeholder="e.g. 101" />
          </div>
          
          <div class="form-row">
            <div class="form-group half">
              <label>Grade Level</label>
              <input type="text" v-model="form.grade_level" required placeholder="e.g. 2" />
            </div>
            
            <div class="form-group half">
              <label>Max Students</label>
              <input type="number" v-model="form.max_students" required min="1" placeholder="25" />
            </div>
          </div>
          
          <div class="form-row">
            <div class="form-group half">
              <label>Max IEP</label>
              <input type="number" v-model="form.max_iep" min="0" placeholder="No limit" />
            </div>
            
            <div class="form-group half">
              <label>Max MLL</label>
              <input type="number" v-model="form.max_mll" min="0" placeholder="No limit" />
            </div>
          </div>
          
          <div v-if="errorMsg" class="error-msg">{{ errorMsg }}</div>
          
          <div class="form-actions">
            <button type="button" v-if="isEditing" @click="resetForm" class="secondary">Cancel</button>
            <button type="submit" class="primary" style="flex: 1;">
              {{ isEditing ? 'Save Changes' : 'Add Class' }}
            </button>
          </div>
        </form>
      </div>
    </aside>

    <main class="editor-main">
      <div class="card list-card">
        <div class="list-header">
          <h2>Classes Roster</h2>
          <div class="list-controls">
            <input type="text" v-model="searchQuery" placeholder="Search by teacher or section..." class="search-input" />
            <select v-model="gradeFilter" class="grade-filter">
              <option value="">All Grades</option>
              <option v-for="g in availableGrades" :key="g" :value="g">Grade {{ g }}</option>
            </select>
            <span class="count-badge">{{ filteredClasses.length }} classes</span>
          </div>
        </div>
        
        <div class="table-container">
          <table v-if="filteredClasses.length > 0">
            <thead>
              <tr>
                <th>Teacher</th>
                <th>Section</th>
                <th>Course</th>
                <th>Grade</th>
                <th>Capacity</th>
                <th>Max IEP</th>
                <th>Max MLL</th>
                <th style="width: 100px; text-align: right;">Action</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(cls, index) in filteredClasses" :key="cls.section_number || index">
                <td>
                  <strong>{{ cls.teacher_name }}</strong>
                </td>
                <td class="text-muted">{{ cls.section_number }}</td>
                <td class="text-muted">{{ cls.course_number }}</td>
                <td>{{ cls.grade_level }}</td>
                <td>{{ cls.max_students }}</td>
                <td>{{ cls.max_iep != null && cls.max_iep !== '' ? cls.max_iep : '—' }}</td>
                <td>{{ cls.max_mll != null && cls.max_mll !== '' ? cls.max_mll : '—' }}</td>
                <td style="text-align: right;">
                  <button @click="editClass(cls)" class="icon-btn edit-btn" title="Edit class">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                  </button>
                  <button @click="deleteClass(cls)" class="icon-btn remove-btn" title="Remove class">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
          
          <div v-else class="empty-state">
            <div class="icon-box" style="margin: 0 auto 1rem; width: 64px; height: 64px; font-size: 2rem;">🔍</div>
            <h3>No Classes Found</h3>
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
  classesData: {
    type: Array,
    default: () => []
  }
});

const emit = defineEmits(['update-classes', 'back']);

const searchQuery = ref("");
const gradeFilter = ref("");
const errorMsg = ref("");
const isEditing = ref(false);
const originalSection = ref(null);

const form = ref({
  section_number: '',
  teacher_name: '',
  course_number: '',
  grade_level: '',
  max_students: 25,
  max_iep: null,
  max_mll: null
});

const safeData = computed(() => Array.isArray(props.classesData) ? props.classesData : []);

const availableGrades = computed(() => {
  const grades = safeData.value.map(c => String(c.grade_level || '').trim()).filter(Boolean);
  const unique = [...new Set(grades)];
  return unique.sort((a, b) => parseInt(a) - parseInt(b));
});

const filteredClasses = computed(() => {
  let list = safeData.value.filter(c => {
    return String(c.section_number || '').trim() !== '' &&
           String(c.teacher_name || '').trim() !== '' &&
           String(c.grade_level || '').trim() !== '';
  });
  
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase().trim();
    list = list.filter(c => 
      String(c.teacher_name || '').toLowerCase().includes(q) ||
      String(c.section_number || '').toLowerCase().includes(q) ||
      String(c.course_number || '').toLowerCase().includes(q)
    );
  }
  
  if (gradeFilter.value) {
    list = list.filter(c => String(c.grade_level || '').trim() === String(gradeFilter.value));
  }
  
  return [...list].sort((a, b) => {
    const nameA = String(a.teacher_name || '').toLowerCase();
    const nameB = String(b.teacher_name || '').toLowerCase();
    return nameA.localeCompare(nameB);
  });
});

const resetForm = () => {
  form.value = {
    section_number: '',
    teacher_name: '',
    course_number: '',
    grade_level: '',
    max_students: 25,
    max_iep: null,
    max_mll: null
  };
  isEditing.value = false;
  originalSection.value = null;
  errorMsg.value = "";
};

const editClass = (cls) => {
  const sNum = String(cls.section_number || '').trim();
  originalSection.value = sNum;
  
  form.value = {
    section_number: sNum,
    teacher_name: String(cls.teacher_name || '').trim(),
    course_number: String(cls.course_number || '').trim(),
    grade_level: String(cls.grade_level || '').trim(),
    max_students: Number(cls.max_students) || 25,
    max_iep: cls.max_iep != null && cls.max_iep !== '' ? Number(cls.max_iep) : null,
    max_mll: cls.max_mll != null && cls.max_mll !== '' ? Number(cls.max_mll) : null
  };
  isEditing.value = true;
  errorMsg.value = "";
};

const deleteClass = (cls) => {
  if (confirm(`Are you sure you want to delete ${cls.teacher_name}'s class?`)) {
    const newData = safeData.value.filter(c => String(c.section_number) !== String(cls.section_number));
    emit('update-classes', newData);
    
    // If we were editing this class, reset the form
    if (isEditing.value && String(form.value.section_number) === String(cls.section_number)) {
      resetForm();
    }
  }
};

const saveClass = () => {
  errorMsg.value = "";
  
  const sNum = String(form.value.section_number).trim();
  const tName = String(form.value.teacher_name).trim();
  const cNum = String(form.value.course_number).trim();
  const sGrade = String(form.value.grade_level).trim();
  const mStudents = Number(form.value.max_students) || 25;
  const mIep = form.value.max_iep != null && form.value.max_iep !== '' ? Number(form.value.max_iep) : null;
  const mMll = form.value.max_mll != null && form.value.max_mll !== '' ? Number(form.value.max_mll) : null;
  
  if (!sNum || !tName || !cNum || !sGrade) {
    errorMsg.value = "Section, Teacher, Course, and Grade are required.";
    return;
  }
  
  const newData = [...safeData.value];
  
  if (isEditing.value && originalSection.value !== null) {
    const index = newData.findIndex(c => String(c.section_number || '').trim() === originalSection.value);
    if (index !== -1) {
      // Preserve other fields that might be attached to the class
      newData[index] = {
        ...newData[index],
        section_number: sNum, // In case we ever allow editing it
        teacher_name: tName,
        course_number: cNum,
        grade_level: sGrade,
        max_students: mStudents,
        max_iep: mIep,
        max_mll: mMll
      };
    } else {
      errorMsg.value = "Could not find the original class to update. Please try again.";
      return;
    }
  } else {
    // Check for duplicate ID (using trimmed comparison)
    if (newData.some(c => String(c.section_number || '').trim() === sNum)) {
      errorMsg.value = "A class with this section number already exists.";
      return;
    }
    
    newData.push({
      section_number: sNum,
      teacher_name: tName,
      course_number: cNum,
      grade_level: sGrade,
      max_students: mStudents,
      max_iep: mIep,
      max_mll: mMll
    });
  }
  
  emit('update-classes', newData);
  resetForm();
};
</script>

<style scoped>
/* Inherit standard layout styles similar to StudentsEditor */
.classes-editor {
  display: grid;
  grid-template-columns: 320px 1fr;
  gap: 2rem;
  max-width: 1400px;
  margin: 0 auto;
}

@media (max-width: 992px) {
  .classes-editor {
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
