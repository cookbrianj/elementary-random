<template>
  <div class="avoids-editor">
    <aside class="editor-sidebar">
      <button @click="$emit('back')" class="back-btn">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 0.5rem;"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
        Back to Dashboard
      </button>
      
      <div class="card add-card">
        <h3>Add Constraint</h3>
        <p class="text-muted" style="font-size: 0.85rem; margin-bottom: 1.5rem;">Select two students that should not be placed in the same classroom.</p>
        
        <form @submit.prevent="addAvoid">
          <div class="form-group">
            <label>Student A</label>
            <select v-model="student1" required :disabled="!hasStudents">
              <option value="" disabled>Select a student</option>
              <option v-for="s in sortedStudents" :key="'s1-'+s.student_number" :value="s.student_number">
                {{ s.student_name }} ({{ s.student_number }})
              </option>
            </select>
          </div>
          
          <div class="form-group">
            <label>Student B</label>
            <select v-model="student2" required :disabled="!hasStudents">
              <option value="" disabled>Select a student</option>
              <option v-for="s in sortedStudents" :key="'s2-'+s.student_number" :value="s.student_number">
                {{ s.student_name }} ({{ s.student_number }})
              </option>
            </select>
          </div>
          
          <div v-if="errorMsg" class="error-msg">{{ errorMsg }}</div>
          
          <button type="submit" class="primary" style="width: 100%; margin-top: 1rem;" :disabled="!hasStudents">
            Add Constraint
          </button>
        </form>
        
        <div v-if="!hasStudents" class="empty-state-sm">
          Please upload students on the dashboard first.
        </div>
      </div>
    </aside>

    <main class="editor-main">
      <div class="card list-card">
        <div class="list-header">
          <h2>Current Constraints</h2>
          <span class="count-badge">{{ parsedAvoids.length }} rules</span>
        </div>
        
        <div class="table-container">
          <table v-if="parsedAvoids.length > 0">
            <thead>
              <tr>
                <th>Student A</th>
                <th>Student B</th>
                <th style="width: 80px; text-align: right;">Action</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(avoid, index) in parsedAvoids" :key="index">
                <td>
                  <strong>{{ getStudentName(avoid.s1) }}</strong>
                  <br><span class="text-muted" style="font-size: 0.8rem">{{ avoid.s1 }}</span>
                </td>
                <td>
                  <strong>{{ getStudentName(avoid.s2) }}</strong>
                  <br><span class="text-muted" style="font-size: 0.8rem">{{ avoid.s2 }}</span>
                </td>
                <td style="text-align: right;">
                  <button @click="removeAvoid(index)" class="remove-btn" title="Remove constraint">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
          
          <div v-else class="empty-state">
            <div class="icon-box" style="margin: 0 auto 1rem; width: 64px; height: 64px; font-size: 2rem;">🚫</div>
            <h3>No Avoid Constraints</h3>
            <p>You haven't defined any student avoid rules yet.</p>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';

const props = defineProps({
  avoidsData: {
    type: Array,
    default: () => null
  },
  studentsData: {
    type: Array,
    default: () => null
  }
});

const emit = defineEmits(['update-avoids', 'back']);

const student1 = ref("");
const student2 = ref("");
const errorMsg = ref("");

const hasStudents = computed(() => {
  return props.studentsData && props.studentsData.length > 0;
});

const sortedStudents = computed(() => {
  if (!hasStudents.value) return [];
  return [...props.studentsData].sort((a, b) => {
    const nameA = String(a.student_name || '').toLowerCase();
    const nameB = String(b.student_name || '').toLowerCase();
    return nameA.localeCompare(nameB);
  });
});

const parsedAvoids = computed(() => {
  if (!props.avoidsData || !Array.isArray(props.avoidsData)) return [];
  
  return props.avoidsData.map(row => {
    const keys = Object.keys(row);
    if (keys.length >= 2) {
      return {
        s1: String(row[keys[0]]).trim(),
        s2: String(row[keys[1]]).trim(),
        original: row
      };
    }
    return null;
  }).filter(Boolean);
});

const getStudentName = (sNum) => {
  if (!hasStudents.value) return `Student ${sNum}`;
  const s = props.studentsData.find(st => String(st.student_number) === String(sNum));
  return s ? s.student_name : `Student ${sNum}`;
};

const addAvoid = () => {
  errorMsg.value = "";
  
  if (!student1.value || !student2.value) {
    errorMsg.value = "Please select both students.";
    return;
  }
  
  if (student1.value === student2.value) {
    errorMsg.value = "A student cannot avoid themselves.";
    return;
  }
  
  // Check if constraint already exists
  const exists = parsedAvoids.value.some(a => 
    (a.s1 === student1.value && a.s2 === student2.value) ||
    (a.s1 === student2.value && a.s2 === student1.value)
  );
  
  if (exists) {
    errorMsg.value = "This constraint already exists.";
    return;
  }
  
  const currentData = Array.isArray(props.avoidsData) ? [...props.avoidsData] : [];
  currentData.push({
    student_number_1: student1.value,
    student_number_2: student2.value
  });
  
  emit('update-avoids', currentData);
  
  // Reset form
  student1.value = "";
  student2.value = "";
};

const removeAvoid = (index) => {
  if (!Array.isArray(props.avoidsData)) return;
  const newData = [...props.avoidsData];
  newData.splice(index, 1);
  emit('update-avoids', newData);
};
</script>

<style scoped>
.avoids-editor {
  display: grid;
  grid-template-columns: 320px 1fr;
  gap: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

@media (max-width: 992px) {
  .avoids-editor {
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

.add-card {
  padding: 1.5rem;
}

.add-card h3 {
  margin-top: 0;
  margin-bottom: 0.5rem;
  color: var(--primary);
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-active);
}

.form-group select {
  width: 100%;
  padding: 0.75rem;
  background-color: rgba(15, 23, 42, 0.5);
  border: 1px solid var(--surface-border);
  border-radius: var(--radius-sm);
  color: var(--text-active);
  font-family: var(--font-sans);
}

.form-group select:focus {
  border-color: var(--primary);
  outline: none;
  box-shadow: 0 0 0 3px rgba(197, 179, 88, 0.15);
}

.form-group select:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.error-msg {
  color: #fb7185;
  font-size: 0.875rem;
  margin-top: 0.5rem;
  padding: 0.5rem;
  background-color: rgba(225, 29, 72, 0.1);
  border-radius: 4px;
}

.empty-state-sm {
  margin-top: 1rem;
  padding: 1rem;
  text-align: center;
  font-size: 0.875rem;
  color: var(--text-muted);
  background-color: rgba(255, 255, 255, 0.02);
  border-radius: var(--radius-sm);
  border: 1px dashed var(--surface-border);
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
}

.list-header h2 {
  margin: 0;
  font-size: 1.25rem;
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

.remove-btn {
  background: transparent;
  border: 1px solid transparent;
  color: var(--text-muted);
  padding: 0.5rem;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all 0.2s ease;
  display: inline-flex;
  align-items: center;
  justify-content: center;
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
